// declare module "*/external_posts.yml" {

export interface Post {
  title: string;
  link: string;
  pubDate: Date;
  publisher: string;
}
declare const posts: Post[];
export default posts;
// }
