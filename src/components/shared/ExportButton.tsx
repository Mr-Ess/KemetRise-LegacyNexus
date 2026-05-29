import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface Props { data: any[]; filename: string; title?: string }

export default function ExportButton({ data, filename, title }: Props) {
  const exportCsv = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
  };
  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };
  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text(title || filename, 14, 16);
    doc.setFontSize(9);
    let y = 26;
    data.slice(0, 60).forEach((row, i) => {
      const txt = Object.entries(row).slice(0, 4).map(([k,v]) => `${k}: ${String(v).slice(0,30)}`).join(" | ");
      doc.text(`${i+1}. ${txt}`, 14, y); y += 6;
      if (y > 280) { doc.addPage(); y = 16; }
    });
    doc.save(`${filename}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1"/>Export</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportCsv}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportXlsx}>Excel</DropdownMenuItem>
        <DropdownMenuItem onClick={exportPdf}>PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
