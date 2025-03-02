import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="p-4 space-y-4">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>
            <Badge>バッジ</Badge>
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <Button>ボタン</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
