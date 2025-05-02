import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAdmin } from '../contexts/AdminContext';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface Report {
  id: string;
  songId: string;
  songTitle: string;
  reason: string;
  details: string;
  createdAt: Timestamp;
  userId: string;
  status: 'pending' | 'resolved' | 'rejected';
  processedAt: Timestamp | null;
  processedBy: string | null;
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching reports...');
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending')
        );

        const snapshot = await getDocs(reportsQuery);
        console.log('Reports snapshot:', snapshot.size, 'documents');
        
        const fetchedReports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];

        // Sort reports by createdAt client-side
        fetchedReports.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        console.log('Fetched reports:', fetchedReports);
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to load reports');
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAdmin, navigate]);

  const handleProcessReport = async (reportId: string, status: 'resolved' | 'rejected') => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        processedAt: new Date(),
        processedBy: 'admin' // You might want to use the actual admin's ID here
      });

      // Remove the processed report from the list
      setReports(prevReports => prevReports.filter(r => r.id !== reportId));
      
      toast.success(`Report ${status}`);
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error('Failed to process report');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          Loading reports...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
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
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{report.songTitle}</h3>
                  <p className="text-sm text-gray-400">
                    Reported: {report.createdAt.toDate().toLocaleDateString()}
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
                  <Button
                    variant="outline"
                    className="text-green-500 hover:bg-green-500/10"
                    onClick={() => handleProcessReport(report.id, 'resolved')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-500 hover:bg-red-500/10"
                    onClick={() => handleProcessReport(report.id, 'rejected')}
                  >
                    <X className="h-4 w-4" />
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