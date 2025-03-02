import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchArticles } from "@/lib/github";

export default async function Home() {
  const posts = await fetchArticles();

  return (
    <div className="p-4 space-y-4">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex flex-wrap gap-2">
            {posts.map((post) => (
              <Badge key={post.id}>{post.title}</Badge>
            ))}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <Button>ボタン</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
