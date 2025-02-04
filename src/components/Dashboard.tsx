import React, { useEffect, useState } from 'react';
import { AlertCircle, Package, CheckCircle, Clock, Search } from 'lucide-react';
import { auth } from '../lib/firebase';
import { subscribeToShipments } from '../services/shipment';
import ShipmentList from './ShipmentList';
import type { Shipment } from '../types';

export default function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to view shipments.');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = subscribeToShipments(
        user.uid,
        (fetchedShipments) => {
          setShipments(fetchedShipments);
          setError(null);
          setLoading(false);
        },
        (error) => {
          console.error('Error in Dashboard:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setError('Failed to load shipments. Please try again later.');
      setLoading(false);
    }
  }, []);

  const totalShipments = shipments.length;
  const confirmedShipments = shipments.filter(s => s.status === 'confirmed').length;
  const pendingShipments = shipments.filter(s => s.status === 'pending').length;

  const filteredShipments = shipments.filter(shipment => 
    shipment.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.receiver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.cargo.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{totalShipments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Confirmed Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedShipments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Pending Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{pendingShipments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search shipments by sender, receiver, or cargo type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Shipments</h2>
      </div>
      <ShipmentList shipments={filteredShipments} />
    </div>
  );
}