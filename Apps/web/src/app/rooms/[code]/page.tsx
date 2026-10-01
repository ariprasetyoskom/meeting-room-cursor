import { RoomDetail } from "@/components/RoomDetail";

type Props = {
  params: { code: string };
};

export default function RoomDetailPage({ params }: Props) {
  return <RoomDetail codeParam={params.code} />;
}
