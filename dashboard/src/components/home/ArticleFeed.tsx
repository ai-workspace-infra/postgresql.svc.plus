import { getHomepagePosts } from '@cms/content'
import ArticleFeedClient from './ArticleFeedClient'

export default async function ArticleFeed() {
  const posts = await getHomepagePosts()

  return <ArticleFeedClient posts={posts} />
}
