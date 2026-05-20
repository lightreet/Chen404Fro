import type { TravelMemoryLocationDetail, TravelMemoryLocationListItem } from '@/types'

function buildListItem(detail: TravelMemoryLocationDetail): TravelMemoryLocationListItem {
  return {
    id: detail.id,
    title: detail.title,
    province: detail.province,
    city: detail.city,
    latitude: detail.latitude,
    longitude: detail.longitude,
    summaryNote: detail.summaryNote,
    coverImage: detail.coverImage,
    visitedAt: detail.visitedAt,
    entryCount: detail.entries.length,
  }
}

function cloneDetail(detail: TravelMemoryLocationDetail): TravelMemoryLocationDetail {
  return {
    ...detail,
    entries: detail.entries.map((entry) => ({ ...entry })),
  }
}

export const demoTravelMemoryDetails: TravelMemoryLocationDetail[] = [
  {
    id: 9001,
    title: '喀什慢行',
    province: '新疆',
    city: '喀什',
    latitude: 39.4677,
    longitude: 75.9898,
    summaryNote: '从老城转进黄昏，风吹过土墙和巷口，旅程像被阳光慢慢烘热。',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2023-09-18',
    entryCount: 4,
    status: 1,
    sortOrder: 1,
    createTime: '2023-09-19 10:00:00',
    updateTime: '2023-09-19 10:00:00',
    entries: [
      {
        id: 90011,
        imageUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        remark: '喀什老城的第一束光',
        thanksNote: '石墙和木门把清晨藏得很安静，像刚翻开的第一页。',
        shotAt: '2023-09-18',
        displayOrder: 1,
        cover: true,
      },
      {
        id: 90012,
        imageUrl:
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
        remark: '巷口风声',
        thanksNote: '拐角的影子被拉得很长，走路的节奏也慢了下来。',
        shotAt: '2023-09-18',
        displayOrder: 2,
      },
      {
        id: 90013,
        imageUrl:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        remark: '热闹集市',
        thanksNote: '颜色、笑声和晚霞混在一起，像旅途中最真实的烟火气。',
        shotAt: '2023-09-19',
        displayOrder: 3,
      },
      {
        id: 90014,
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        remark: '长路尽头',
        thanksNote: '回头看走过的街巷，才发现记忆已经被一格格装满。',
        shotAt: '2023-09-19',
        displayOrder: 4,
      },
    ],
  },
  {
    id: 9002,
    title: '成都慢调',
    province: '四川',
    city: '成都',
    latitude: 30.5728,
    longitude: 104.0665,
    summaryNote: '在茶馆和树影之间慢下来，把旅途的节拍调成刚刚好的温柔。',
    coverImage:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2024-04-06',
    entryCount: 4,
    status: 1,
    sortOrder: 2,
    createTime: '2024-04-07 10:00:00',
    updateTime: '2024-04-07 10:00:00',
    entries: [
      {
        id: 90021,
        imageUrl:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        remark: '树影落在湖面',
        thanksNote: '这一站最舒服的不是赶路，而是愿意把时间慢慢放轻。',
        shotAt: '2024-04-06',
        displayOrder: 1,
        cover: true,
      },
      {
        id: 90022,
        imageUrl:
          'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
        remark: '午后街角',
        thanksNote: '风吹过梧桐的时候，整座城都像在陪人散步。',
        shotAt: '2024-04-06',
        displayOrder: 2,
      },
      {
        id: 90023,
        imageUrl:
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
        remark: '落日之前',
        thanksNote: '旅程里最难忘的，总是这种没有安排却刚好发生的时刻。',
        shotAt: '2024-04-07',
        displayOrder: 3,
      },
      {
        id: 90024,
        imageUrl:
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
        remark: '夜色微甜',
        thanksNote: '灯光慢慢亮起来，照片也把这一页故事固定住了。',
        shotAt: '2024-04-07',
        displayOrder: 4,
      },
    ],
  },
  {
    id: 9003,
    title: '长安傍晚',
    province: '陕西',
    city: '西安',
    latitude: 34.3416,
    longitude: 108.9398,
    summaryNote: '一座城市把风、城墙和晚霞一起收好，走在里面像翻一页旧诗。',
    coverImage:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2024-04-10',
    entryCount: 3,
    status: 1,
    sortOrder: 3,
    createTime: '2024-04-11 10:00:00',
    updateTime: '2024-04-11 10:00:00',
    entries: [
      {
        id: 90031,
        imageUrl:
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
        remark: '城墙边的风',
        thanksNote: '天色刚要暗下来，城市的轮廓反而变得更清楚了。',
        shotAt: '2024-04-10',
        displayOrder: 1,
        cover: true,
      },
      {
        id: 90032,
        imageUrl:
          'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80',
        remark: '傍晚街灯',
        thanksNote: '热闹从不匆忙，像每个路口都愿意多留人一会儿。',
        shotAt: '2024-04-10',
        displayOrder: 2,
      },
      {
        id: 90033,
        imageUrl:
          'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
        remark: '把夜色收进相册',
        thanksNote: '照片不只是记住景色，也把当时那点轻松和满足一起留住。',
        shotAt: '2024-04-11',
        displayOrder: 3,
      },
    ],
  },
  {
    id: 9004,
    title: '京城春日',
    province: '北京',
    city: '北京',
    latitude: 39.9042,
    longitude: 116.4074,
    summaryNote: '风从城里穿过去，带来一点明亮、一点秩序，还有很适合散步的春天。',
    coverImage:
      'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2024-04-15',
    entryCount: 3,
    status: 1,
    sortOrder: 4,
    createTime: '2024-04-16 10:00:00',
    updateTime: '2024-04-16 10:00:00',
    entries: [
      {
        id: 90041,
        imageUrl:
          'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
        remark: '春天正好',
        thanksNote: '不着急赶下一站的时候，整座城市都会变得更好看。',
        shotAt: '2024-04-15',
        displayOrder: 1,
        cover: true,
      },
      {
        id: 90042,
        imageUrl:
          'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
        remark: '天光落下来',
        thanksNote: '云层和建筑的边界很干净，照片一按下去就有了故事感。',
        shotAt: '2024-04-15',
        displayOrder: 2,
      },
      {
        id: 90043,
        imageUrl:
          'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
        remark: '路过的一阵风',
        thanksNote: '那种很轻的快乐，往往就藏在一张不经意的照片里。',
        shotAt: '2024-04-16',
        displayOrder: 3,
      },
    ],
  },
  {
    id: 9005,
    title: '厦门海风',
    province: '福建',
    city: '厦门',
    latitude: 24.4798,
    longitude: 118.0894,
    summaryNote: '海风把旅途吹得很轻，阳光、街道和傍晚都像在慢慢发亮。',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2024-05-02',
    entryCount: 4,
    status: 1,
    sortOrder: 5,
    createTime: '2024-05-03 10:00:00',
    updateTime: '2024-05-03 10:00:00',
    entries: [
      {
        id: 90051,
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        remark: '海风来信',
        thanksNote: '这张照片像这一站的封面，一眼就能把当时的空气想起来。',
        shotAt: '2024-05-02',
        displayOrder: 1,
        cover: true,
      },
      {
        id: 90052,
        imageUrl:
          'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
        remark: '傍晚的浪',
        thanksNote: '海面在变颜色，心情也跟着慢慢静下来。',
        shotAt: '2024-05-02',
        displayOrder: 2,
      },
      {
        id: 90053,
        imageUrl:
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
        remark: '沿街光影',
        thanksNote: '走到哪里都不需要赶，旅程因此显得特别宽松。',
        shotAt: '2024-05-03',
        displayOrder: 3,
      },
      {
        id: 90054,
        imageUrl:
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        remark: '把假日留住',
        thanksNote: '最后一张照片像句号，也像提醒自己以后还会再来。',
        shotAt: '2024-05-03',
        displayOrder: 4,
      },
    ],
  },
]

export const demoTravelMemoryList: TravelMemoryLocationListItem[] = demoTravelMemoryDetails.map(buildListItem)

export function createDemoTravelMemoryList(): TravelMemoryLocationListItem[] {
  return demoTravelMemoryList.map((item) => ({ ...item }))
}

export function createDemoTravelMemoryDetailMap(): Record<number, TravelMemoryLocationDetail> {
  return Object.fromEntries(demoTravelMemoryDetails.map((detail) => [detail.id, cloneDetail(detail)]))
}
