import { useUserRole } from "@/hooks/use-user-role";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useBetaReadOnly() {
  const { user } = useAuth();
  const { isOwner, isAdmin } = useUserRole();

  const canWrite = !user || isOwner || isAdmin;

  const guardAction = (action?: () => void) => {
    if (canWrite) {
      action?.();
      return true;
    }
    toast({
      title: "Read-only during beta",
      description: "This action is disabled during the private beta preview.",
      variant: "destructive",
    });
    return false;
  };

  return { canWrite, guardAction };
}
