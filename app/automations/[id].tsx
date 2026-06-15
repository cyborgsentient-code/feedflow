import { useLocalSearchParams } from "expo-router";
import AutomationDetailScreen from "@/features/automation-management/screens/AutomationDetailScreen";

export default function AutomationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AutomationDetailScreen id={id} />;
}
