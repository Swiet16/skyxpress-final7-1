import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, MapPin, Calendar, Clock, Truck } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface TrackingResult {
  tracking_number: string;
  current_status: string;
  origin: string;
  destination: string;
  service_type: string;
  estimated_delivery: string;
  events: Json;
  detailed_status: Json;
}

const PublicTracking = () => {
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking ID or reference ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      // Search by tracking ID OR reference ID
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .or(`tracking_id.eq.${trackingId.trim()},reference_id.eq.${trackingId.trim()}`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Map to TrackingResult format
        setTrackingResult({
          tracking_number: data.tracking_id,
          current_status: data.shipping_status || data.current_status,
          origin: data.from_country,
          destination: data.to_country,
          service_type: data.service_type || 'standard',
          estimated_delivery: data.estimated_delivery || '',
          events: data.status_timeline || [],
          detailed_status: data.detailed_status || {}
        });
      } else {
        setTrackingResult(null);
        toast({
          title: "Not Found",
          description: "No shipment found with this tracking ID or reference ID",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'in_transit': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      case 'delayed': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
      case 'out_for_delivery': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg';
      case 'processing': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'out_for_delivery': return <MapPin className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            <Search className="h-6 w-6 text-primary" />
            Track Your Shipment
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Enter your Reference ID or Tracking ID to get real-time updates
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="e.g., 2119901 or 000567000600"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Track"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingResult && (
        <div className="space-y-6">
          {/* Shipment Overview */}
          <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-mono text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {trackingResult.tracking_number}
                </span>
                <Badge className={getStatusColor(trackingResult.current_status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(trackingResult.current_status)}
                    {trackingResult.current_status.replace('_', ' ').toUpperCase()}
                  </div>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Route</div>
                    <div className="font-semibold">
                      {trackingResult.origin} → {trackingResult.destination}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Service Type</div>
                    <div className="font-semibold capitalize">
                      {trackingResult.service_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                {trackingResult.estimated_delivery && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Est. Delivery</div>
                      <div className="font-semibold">
                        {new Date(trackingResult.estimated_delivery).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Location */}
              {trackingResult.detailed_status && typeof trackingResult.detailed_status === 'object' && 
               (trackingResult.detailed_status as any)?.location && (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Current Location</span>
                  </div>
                  <div className="text-foreground">{(trackingResult.detailed_status as any).location}</div>
                  {(trackingResult.detailed_status as any).notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {(trackingResult.detailed_status as any).notes}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          {trackingResult.events && Array.isArray(trackingResult.events) && trackingResult.events.length > 0 && (
            <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Tracking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(trackingResult.events as any[])
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((event: any, index: number) => (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                        index === 0 ? 'bg-gradient-to-r from-primary to-secondary shadow-lg' : 'bg-gradient-to-r from-muted to-muted-foreground/30'
                      }`} />
                      
                      {/* Timeline line */}
                      {index < (trackingResult.events as any[]).length - 1 && (
                        <div className="absolute left-6 top-5 w-px h-16 bg-gradient-to-b from-primary/30 to-muted" />
                      )}
                      
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(event.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(event.status)}
                              {event.status.replace('_', ' ').toUpperCase()}
                            </div>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {event.location}
                          </div>
                        )}
                        
                        {event.notes && (
                          <div className="text-sm text-foreground">
                            {event.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No results message */}
      {searched && !trackingResult && !loading && (
        <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/10 shadow-lg">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Shipment Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find a shipment with the ID "{trackingId}"
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your Reference ID or Tracking ID and try again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicTracking;