import { getHomepagePosts } from '@cms/content'
import CommunityFeed from './CommunityFeed'

export default async function CommunityFeedServer() {
  const posts = await getHomepagePosts()
  return <CommunityFeed posts={posts} />
}
