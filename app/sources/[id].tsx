import { useLocalSearchParams } from "expo-router";
import SourceDetailScreen from "@/features/sources/screens/SourceDetailScreen";

export default function SourceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SourceDetailScreen id={id} />;
}
