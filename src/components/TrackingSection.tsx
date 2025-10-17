import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";


interface TrackingResult {
  tracking_id: string;
  sender_name: string;
  receiver_name: string;
  current_status: string;
  from_country: string;
  to_country: string;
  status_timeline: any[];
  live_route: boolean;
  route_checkpoints: any[];
}

const statusIcons = {
  created: Clock,
  picked_up: Package,
  in_transit: Truck,
  customs: MapPin,
  out_for_delivery: Truck,
  delivered: CheckCircle,
};

const statusColors = {
  created: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg",
  picked_up: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg", 
  in_transit: "bg-gradient-to-r from-primary/70 to-secondary/70 text-white shadow-lg",
  customs: "bg-gradient-to-r from-primary/80 to-secondary/80 text-white shadow-lg",
  out_for_delivery: "bg-gradient-to-r from-primary/90 to-secondary/90 text-white shadow-lg",
  delivered: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg",
};

export const TrackingSection = () => {
  const [trackingQuery, setTrackingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const { toast } = useToast();

  const handleTrackParcel = async () => {
    if (!trackingQuery.trim()) {
      toast({
        title: "Please enter tracking ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Search by tracking ID OR reference ID
      const { data: parcelData } = await supabase
        .from('parcels')
        .select('*')
        .or(`tracking_id.eq.${trackingQuery.trim()},reference_id.eq.${trackingQuery.trim()}`)
        .single();

      if (parcelData) {
        // Check if request is approved before showing tracking
        if (parcelData.request_status !== 'approved') {
          toast({
            title: "Request Pending",
            description: "This shipment request is still pending approval from admin.",
            variant: "default",
          });
          setTrackingResult(null);
        } else {
          setTrackingResult({
            tracking_id: parcelData.tracking_id,
            sender_name: parcelData.sender_name,
            receiver_name: parcelData.receiver_name,
            current_status: parcelData.shipping_status || parcelData.current_status,
            from_country: parcelData.from_country,
            to_country: parcelData.to_country,
            status_timeline: parcelData.status_timeline || [],
            live_route: parcelData.live_route || false,
            route_checkpoints: parcelData.route_checkpoints || [],
          });

          toast({
            title: "Parcel found!",
            description: `Status: ${parcelData.shipping_status || parcelData.current_status}`,
          });
        }
      } else {
        toast({
          title: "Parcel not found",
          description: "Please check your tracking ID and try again.",
          variant: "destructive",
        });
        setTrackingResult(null);
      }
    } catch (error) {
      console.error('Tracking error:', error);
      toast({
        title: "Error",
        description: "Unable to track parcel. Please try again.",
        variant: "destructive",
      });
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = trackingResult ? statusIcons[trackingResult.current_status as keyof typeof statusIcons] || Clock : Clock;

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-24 translate-x-24 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          {/* Tracking Input */}
          <Card className="mb-8 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-5 rounded-2xl shadow-lg">
  <Search className="h-10 w-10 text-white" />
</div>
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
  Track Your Parcel
</CardTitle>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
                Enter your Reference ID or Tracking ID to get real-time updates on your shipment
              </p>
            </CardHeader>
            <CardContent className="pt-0 pb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter Reference ID (e.g., 2119901) or Tracking ID..."
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    className="h-16 text-lg pl-6 pr-14 border-2 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-2xl bg-background shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrackParcel()}
                  />
                  <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/60" />
                </div>
                <Button 
                  onClick={handleTrackParcel}
                  disabled={isLoading}
                  size="lg"
                   className="h-16 px-12 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 
text-white font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl 
transition-all duration-300 transform hover:-translate-y-0.5 disabled:hover:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="mr-3 h-5 w-5" />
                      Track Parcel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingResult && (
            <Card className="shadow-xl border-0 bg-card/90 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-1">
                <CardHeader className="bg-card rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-foreground">Parcel Details</CardTitle>
                    <Badge 
                      className={`${statusColors[trackingResult.current_status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"} px-4 py-2 rounded-full font-semibold text-sm`}
                    >
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {trackingResult.current_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="space-y-6">
                {/* Parcel Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking ID</p>
                    <p className="font-mono font-semibold">{trackingResult.tracking_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-semibold">{trackingResult.from_country} → {trackingResult.to_country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sender</p>
                    <p className="font-semibold">{trackingResult.sender_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receiver</p>
                    <p className="font-semibold">{trackingResult.receiver_name}</p>
                  </div>
                </div>

                {/* Status Timeline */}
                {trackingResult.status_timeline.length > 0 && (
                  <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-primary/10">
                    <h3 className="font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tracking History</h3>
                    <div className="space-y-3">
                      {trackingResult.status_timeline.map((event, index) => {
                        const EventIcon = statusIcons[event.status as keyof typeof statusIcons] || Clock;
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-primary/5 hover:border-primary/20 transition-colors">
                            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-2 rounded-full">
                              <EventIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{event.status.replace('_', ' ').toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Route Map Placeholder */}
                {trackingResult.live_route && trackingResult.route_checkpoints.length > 0 && (
                  <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-xl p-6 border border-primary/10">
                    <h3 className="font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Live Route</h3>
                    <div className="bg-gradient-to-br from-muted/50 to-background/80 rounded-lg p-6 text-center border border-primary/10">
                      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-full w-fit mx-auto mb-4">
                        <MapPin className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-muted-foreground">Live route map with {trackingResult.route_checkpoints.length} checkpoints</p>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};