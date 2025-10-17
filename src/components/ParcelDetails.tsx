import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, User, MapPin, Clock, Truck, CheckCircle } from "lucide-react";
import { BillDownloader } from "./BillDownloader";

interface ParcelDetailsProps {
  parcel: any;
  onUpdate: () => void;
  onClose: () => void;
}

const statusOptions = [
  { value: 'created', label: 'Created', icon: Clock },
  { value: 'picked_up', label: 'Picked Up', icon: Package },
  { value: 'in_transit', label: 'In Transit', icon: Truck },
  { value: 'customs', label: 'In Customs', icon: MapPin },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: Clock },
];

const statusColors = {
  created: "bg-yellow-100 text-yellow-800",
  picked_up: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  customs: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const ParcelDetails = ({ parcel, onUpdate, onClose }: ParcelDetailsProps) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const getNextAllowedStatuses = (currentStatus: string) => {
    const statusFlow = {
      'created': ['picked_up', 'cancelled'],
      'picked_up': ['in_transit', 'cancelled'],
      'in_transit': ['customs', 'out_for_delivery', 'cancelled'],
      'customs': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': [], // Final status - no further changes allowed
      'cancelled': [] // Final status - no further changes allowed
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || [];
  };

  const updateParcelStatus = async (newStatus: string) => {
    const allowedStatuses = getNextAllowedStatuses(parcel.current_status);
    
    if (!allowedStatuses.includes(newStatus)) {
      toast({
        title: "Invalid Status Change",
        description: "This status change is not allowed in the current workflow",
        variant: "destructive",
      });
      return;
    }

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('parcels')
        .update({ 
          current_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', parcel.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Parcel status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error updating parcel status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update parcel status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const StatusIcon = statusOptions.find(s => s.value === parcel.current_status)?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{parcel.tracking_id}</h2>
          <p className="text-muted-foreground">{parcel.from_country} → {parcel.to_country}</p>
        </div>
        <Badge className={statusColors[parcel.current_status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          <StatusIcon className="w-4 h-4 mr-2" />
          {parcel.current_status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Sender & Receiver Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sender
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-semibold">{parcel.sender_name}</p>
              {parcel.sender_company && (
                <p className="text-sm text-muted-foreground">{parcel.sender_company}</p>
              )}
              <p className="text-sm text-muted-foreground">{parcel.sender_phone}</p>
              <p className="text-sm text-muted-foreground">{parcel.sender_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Address:</p>
              <p className="text-sm text-muted-foreground">{parcel.sender_address}</p>
              <p className="text-sm text-muted-foreground">{parcel.sender_city}, {parcel.sender_country}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Receiver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-semibold">{parcel.receiver_name}</p>
              <p className="text-sm text-muted-foreground">{parcel.receiver_phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Address:</p>
              <p className="text-sm text-muted-foreground">{parcel.receiver_address}</p>
              <p className="text-sm text-muted-foreground">
                {parcel.receiver_city}, {parcel.receiver_state}
              </p>
              <p className="text-sm text-muted-foreground">
                {parcel.receiver_country} - {parcel.receiver_postal_code}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parcel Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parcel Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Type:</p>
              <p className="text-sm text-muted-foreground capitalize">{parcel.parcel_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Service:</p>
              <p className="text-sm text-muted-foreground capitalize">{parcel.service_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Document Type:</p>
              <p className="text-sm text-muted-foreground capitalize">{parcel.document_type || 'Document'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Weight:</p>
              <p className="text-sm text-muted-foreground">{parcel.weight} kg</p>
            </div>
            <div>
              <p className="text-sm font-medium">Dimensions:</p>
              <p className="text-sm text-muted-foreground">
                {parcel.length}×{parcel.width}×{parcel.height} cm
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Chargeable Weight:</p>
              <p className="text-sm text-muted-foreground">
                {parcel.chargeable_weight || parcel.weight} kg
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Price:</p>
              <p className="text-sm font-semibold text-primary">
                {parcel.currency} {parcel.total_price?.toFixed(2)}
              </p>
            </div>
          </div>
          
          {parcel.declared_value > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium">Declared Value:</p>
              <p className="text-sm text-muted-foreground">
                USD {parcel.declared_value.toFixed(2)}
              </p>
            </div>
          )}

          {parcel.items && parcel.items.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Items:</p>
              <div className="space-y-2">
                {parcel.items.map((item: any, index: number) => (
                  <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground">
                      Qty: {item.quantity} • Price: ${item.unit_price} • Total: ${item.total}
                      {item.hs_code && ` • HS Code: ${item.hs_code}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parcel.special_instructions && (
            <div className="mt-4">
              <p className="text-sm font-medium">Special Instructions:</p>
              <p className="text-sm text-muted-foreground">{parcel.special_instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Bills - Admin View */}
      <BillDownloader parcel={parcel} showAll={true} />

      {/* Status Update */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={parcel.current_status}
              onValueChange={updateParcelStatus}
              disabled={updatingStatus || getNextAllowedStatuses(parcel.current_status).length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={parcel.current_status} disabled>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    {statusOptions.find(s => s.value === parcel.current_status)?.label} (Current)
                  </div>
                </SelectItem>
                {getNextAllowedStatuses(parcel.current_status).map((statusValue) => {
                  const status = statusOptions.find(s => s.value === statusValue);
                  if (!status) return null;
                  return (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {updatingStatus && (
              <div className="text-sm text-muted-foreground">Updating...</div>
            )}
            {getNextAllowedStatuses(parcel.current_status).length === 0 && (
              <div className="text-sm text-muted-foreground">
                {parcel.current_status === 'delivered' ? 'Package delivered - no further updates allowed' : 
                 parcel.current_status === 'cancelled' ? 'Package cancelled - no further updates allowed' : 
                 'No status updates available'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      {parcel.status_timeline && parcel.status_timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcel.status_timeline.map((event: any, index: number) => {
                const EventIcon = statusOptions.find(s => s.value === event.status)?.icon || Clock;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
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
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};