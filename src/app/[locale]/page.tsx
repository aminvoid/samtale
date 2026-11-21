import { HomeScreen } from "@/features/home/home-screen";
import { listTopicIds } from "@/lib/content/repository";

export default async function HomePage() {
  const topicIds = await listTopicIds();
  return <HomeScreen topicCount={topicIds.length} />;
}
