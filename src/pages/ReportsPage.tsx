import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAdmin } from '../contexts/AdminContext';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface Report {
  id: string;
  songId: string;
  songTitle: string;
  reason: string;
  details: string;
  timestamp: any;
  userId: string;
  status: 'pending' | 'resolved';
}

const ReportsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      navigate('/');
      return;
    }

    const fetchReports = async () => {
      try {
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending'),
          orderBy('timestamp', 'desc')
        );
        
        const snapshot = await getDocs(reportsQuery);
        const fetchedReports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];
        
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAdmin, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Reported Songs</h2>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No pending reports to review.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{report.songTitle}</h3>
                  <p className="text-sm text-gray-400">
                    Reported: {new Date(report.timestamp.toDate()).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    <span className="font-semibold">Reason:</span> {report.reason}
                  </p>
                  {report.details && (
                    <p className="text-sm text-gray-300 mt-1">
                      <span className="font-semibold">Details:</span> {report.details}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/song/${report.songId}`)}
                  >
                    View Song
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 