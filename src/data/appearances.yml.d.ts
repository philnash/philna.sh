// declare module "*/appearances.yml" {
export interface Talk {
  title: string;
  slides?: string;
  video?: string;
  audio?: string;
}
interface Event {
  name: string;
  link: string;
  start_date: Date;
  end_date?: Date;
  location: string;
}
export interface Appearance {
  event: Event;
  talks: Array<Talk>;
  roles?: string[];
}
declare const appearances: Appearance[];
export default appearances;
// }
