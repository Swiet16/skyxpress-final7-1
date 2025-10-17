import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Truck, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApprovedParcel {
  id: string;
  tracking_id: string;
  sender_name: string;
  receiver_name: string;
  from_country: string;
  to_country: string;
  shipping_status: string;
  approved_at: string;
  total_price: number;
}

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800",
  picked_up: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  customs: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
};

export const ApprovedParcelsSection = () => {
  const [parcels, setParcels] = useState<ApprovedParcel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovedParcels();

    // Real-time subscription
    const channel = supabase
      .channel('approved_parcels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parcels',
          filter: 'request_status=eq.approved'
        },
        () => {
          fetchApprovedParcels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApprovedParcels = async () => {
    try {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('request_status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setParcels(data || []);
    } catch (error: any) {
      console.error('Error fetching approved parcels:', error);
      toast({
        title: "Error",
        description: "Failed to load approved parcels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (parcelId: string, newStatus: string) => {
    setUpdatingStatus(parcelId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('update_shipping_status', {
        parcel_id_param: parcelId,
        admin_user_id: user.id,
        new_status: newStatus,
        status_note: `Status updated to ${newStatus}`
      });

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Shipping status updated to ${newStatus}`,
      });

      fetchApprovedParcels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredParcels = parcels.filter(parcel => {
    const query = searchQuery.toLowerCase();
    return (
      parcel.tracking_id.toLowerCase().includes(query) ||
      parcel.sender_name.toLowerCase().includes(query) ||
      parcel.receiver_name.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Approved Parcels ({filteredParcels.length})
          </CardTitle>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approved parcels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Shipping Status</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParcels.map((parcel) => (
                <TableRow key={parcel.id}>
                  <TableCell>
                    <div className="font-mono font-semibold text-primary">
                      {parcel.tracking_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{parcel.sender_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{parcel.receiver_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{parcel.from_country} → {parcel.to_country}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">${parcel.total_price?.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[parcel.shipping_status as keyof typeof statusColors]}>
                      {parcel.shipping_status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(parcel.approved_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={parcel.shipping_status}
                        onValueChange={(value) => handleStatusUpdate(parcel.id, value)}
                        disabled={updatingStatus === parcel.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="customs">Customs</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredParcels.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No approved parcels yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};