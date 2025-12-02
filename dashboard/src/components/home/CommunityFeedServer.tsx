import { getHomepagePosts } from '@lib/marketingContent'
import CommunityFeed from './CommunityFeed'

export default async function CommunityFeedServer() {
  const posts = await getHomepagePosts()
  return <CommunityFeed posts={posts} />
}
