import SimpleCrud from "@/components/shared/SimpleCrud";
import { CreditCard } from "lucide-react";

export default function PaymentGateways() {
  return <SimpleCrud title="Payment Gateways" table="payment_gateways" icon={CreditCard}
    fields={[
      { name: "gateway_name", label: "Gateway Name", required: true, placeholder: "Stripe, Paddle, Paymob..." },
      { name: "brand_id", label: "Brand ID (UUID)" },
      { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    ]}
    columns={[
      { key: "gateway_name", label: "Gateway" },
      { key: "is_active", label: "Active", render: (v: any) => v ? "✅" : "❌" },
      { key: "created_at", label: "Added", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
    ]} />;
}
