import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequestReceivedMessageProps {
  isAr: boolean;
  onAcknowledge: () => void;
  className?: string;
}

export default function RequestReceivedMessage({
  isAr,
  onAcknowledge,
  className,
}: RequestReceivedMessageProps) {
  return (
    <div className={className ?? "flex flex-col items-center justify-center gap-5 py-10 text-center px-4"}>
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">
          {isAr ? "تم استلام طلبك بنجاح!" : "Request Received!"}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed max-w-sm">
          {isAr
            ? "تم استلام طلبك بنجاح، وسيقوم الموظف الرقمي المختص بالتواصل معك فوراً خلال 24 ساعة عمل."
            : "Your request has been received. Our specialist digital agent will contact you within 24 business hours."}
        </p>
      </div>
      <Button
        size="sm"
        onClick={onAcknowledge}
        className="text-xs"
        variant="outline"
      >
        {isAr ? "حسناً، شكراً!" : "Got it, thanks!"}
      </Button>
    </div>
  );
}