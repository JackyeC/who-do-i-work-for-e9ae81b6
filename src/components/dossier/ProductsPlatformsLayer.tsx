import { Package, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  name: string;
  description?: string;
  category?: string;
  url?: string;
}

interface ProductsPlatformsProps {
  products: Product[];
  companyName: string;
}

export function ProductsPlatformsLayer({ products, companyName }: ProductsPlatformsProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No product data available yet for {companyName}.</p>
        <p className="text-micro text-muted-foreground mt-1">Product intelligence is enriched during company scans.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {products.map((product, i) => (
        <Card key={i} className="border-border/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground text-body">{product.name}</h4>
                {product.category && <Badge variant="secondary" className="mt-1 text-micro">{product.category}</Badge>}
              </div>
              {product.url && (
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {product.description && <p className="text-caption text-muted-foreground mt-2 leading-relaxed">{product.description}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
