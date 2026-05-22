import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputDir = resolve(projectRoot, 'public/maps');
const geoJsonOutput = resolve(outputDir, 'china-city.geojson');
const provinceGeoJsonOutput = resolve(outputDir, 'china-province.geojson');
const manifestOutput = resolve(outputDir, 'china-city.manifest.json');
const packageJsonPath = require.resolve('china-map-geojson/package.json');
const sourcePackage = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const { ChinaData, ProvinceData } = require('china-map-geojson');

const PROVINCE_NAMES = {
  Anhui: '安徽省',
  Aomen: '澳门特别行政区',
  Beijing: '北京市',
  Chongqing: '重庆市',
  Fujian: '福建省',
  Gansu: '甘肃省',
  Guangdong: '广东省',
  Guangxi: '广西壮族自治区',
  Guizhou: '贵州省',
  Hainan: '海南省',
  Hebei: '河北省',
  Henan: '河南省',
  Heilongjiang: '黑龙江省',
  Hubei: '湖北省',
  Hunan: '湖南省',
  Jilin: '吉林省',
  Jiangsu: '江苏省',
  Jiangxi: '江西省',
  Liaoning: '辽宁省',
  Neimenggu: '内蒙古自治区',
  Ningxia: '宁夏回族自治区',
  Qinghai: '青海省',
  Shandong: '山东省',
  Shanxi_1: '山西省',
  Shanxi_3: '陕西省',
  Shanghai: '上海市',
  Sichuan: '四川省',
  Taiwan: '台湾省',
  Tianjin: '天津市',
  Xianggang: '香港特别行政区',
  Xinjiang: '新疆维吾尔自治区',
  Xizang: '西藏自治区',
  Yunnan: '云南省',
  Zhejiang: '浙江省',
};

function normalizeFeature(feature, provinceKey) {
  const properties = feature.properties ?? {};
  const center = Array.isArray(properties.cp)
    ? properties.cp.slice(0, 2).map((value) => Number(value))
    : undefined;

  return {
    type: 'Feature',
    id: String(feature.id ?? properties.adcode ?? ''),
    properties: {
      adcode: String(feature.id ?? properties.adcode ?? ''),
      name: String(properties.name ?? ''),
      center,
      provinceKey,
      provinceName: PROVINCE_NAMES[provinceKey] ?? provinceKey,
    },
    geometry: feature.geometry,
  };
}

function normalizeProvinceFeature(feature, index) {
  const properties = feature.properties ?? {};
  const center = Array.isArray(properties.cp)
    ? properties.cp.slice(0, 2).map((value) => Number(value))
    : undefined;
  const name = String(properties.name ?? `province-${index + 1}`);

  return {
    type: 'Feature',
    id: String(feature.id ?? name),
    properties: {
      adcode: String(feature.id ?? ''),
      name,
      center,
    },
    geometry: feature.geometry,
  };
}

const features = Object.entries(ProvinceData).flatMap(([provinceKey, collection]) => {
  if (!collection || !Array.isArray(collection.features)) {
    return [];
  }
  return collection.features.map((feature) => normalizeFeature(feature, provinceKey));
});

const geoJson = {
  type: 'FeatureCollection',
  name: 'china-city-boundaries',
  features,
};
const provinceFeatures = Array.isArray(ChinaData?.features)
  ? ChinaData.features.map((feature, index) => normalizeProvinceFeature(feature, index))
  : [];
const provinceGeoJson = {
  type: 'FeatureCollection',
  name: 'china-province-boundaries',
  features: provinceFeatures,
};

const geoJsonContent = JSON.stringify(geoJson);
const provinceGeoJsonContent = JSON.stringify(provinceGeoJson);
const checksum = createHash('sha256').update(geoJsonContent).digest('hex');
const provinceChecksum = createHash('sha256').update(provinceGeoJsonContent).digest('hex');
const manifest = {
  id: 'china-city-boundaries',
  version: sourcePackage.version,
  source: {
    package: sourcePackage.name,
    version: sourcePackage.version,
    repository: sourcePackage.repository?.url ?? sourcePackage.homepage,
    license: sourcePackage.license,
  },
  coordinateSystem: 'WGS84',
  files: {
    cityGeoJson: '/maps/china-city.geojson',
    provinceGeoJson: '/maps/china-province.geojson',
  },
  featureCount: features.length,
  provinceFeatureCount: provinceFeatures.length,
  byteSize: Buffer.byteLength(geoJsonContent),
  provinceByteSize: Buffer.byteLength(provinceGeoJsonContent),
  sha256: checksum,
  provinceSha256: provinceChecksum,
  generatedBy: 'scripts/build-china-city-map.mjs',
};

await mkdir(outputDir, { recursive: true });
await writeFile(geoJsonOutput, geoJsonContent, 'utf8');
await writeFile(provinceGeoJsonOutput, provinceGeoJsonContent, 'utf8');
await writeFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`[maps] wrote ${features.length} city boundaries to ${geoJsonOutput}`);
console.log(`[maps] wrote ${provinceFeatures.length} province boundaries to ${provinceGeoJsonOutput}`);
console.log(`[maps] size=${manifest.byteSize} sha256=${checksum}`);
