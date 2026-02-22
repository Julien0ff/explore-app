export type Profile = {
  id: string;
  username: string;
  avatar_url: string;
  updated_at: string;
};

export type HistoryItem = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  visited_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
  parent_id?: string;
  type?: 'folder' | 'link';
};
