import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  createLabel?: string;
  createTo?: string;
  backTo?: string;
}

export default function PageHeader({ title, createLabel, createTo, backTo }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {backTo && (
          <button onClick={() => navigate(backTo)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={20} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      {createLabel && createTo && (
        <Button onClick={() => navigate(createTo)} className="gap-2">
          <Plus size={16} />
          {createLabel}
        </Button>
      )}
    </div>
  );
}
