import React, { useState, useEffect } from 'react';
import { getJobs, deleteJob } from './api';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isKanbanView, setIsKanbanView] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch jobs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(parseInt(jobId));
        // Refresh the jobs list after deletion
        await fetchJobs();
      } catch (err) {
        setError('Failed to delete job');
        console.error('Delete error:', err);
      }
    }
  };

  const getJobsByStatus = (status) => {
    if (!jobs) return [];
    return jobs.filter(job => job.Status.toLowerCase() === status.toLowerCase());
  };

  const formatCompanyForLogo = (company) => {
    if (!company) return '';
    // Remove common suffixes and special characters
    return company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .replace(/(inc|llc|corp|corporation|limited|ltd)$/g, '') // Remove common suffixes
      .trim();
  };

  const getLogoUrl = (company) => {
    const formattedCompany = formatCompanyForLogo(company);
    if (!formattedCompany) return null;
    return `https://img.logo.dev/${formattedCompany}.com?token=${import.meta.env.VITE_LOGO_DEV_KEY}`;
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!jobs) return <div className="p-4 text-red-500">No jobs data available</div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      <div className="container mx-auto p-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            <img src="/logos/toucanlogo.png" className="w-20 h-20 inline-block mr-0" alt="Toucan Logo"></img>
            Toucan
          </h1>
          <button
            onClick={() => setIsKanbanView(!isKanbanView)}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/90 transition-colors"
          >
            {isKanbanView ? 'Table View' : 'Kanban View'}
          </button>
        </div>

        {isKanbanView ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Applied</h2>
              <div className="space-y-3">
                {getJobsByStatus('applied').map((job) => (
                  <div key={job.ID} className="bg-white/90 p-3 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{job.Title}</h3>
                        <div className="flex items-center gap-2">
                          {getLogoUrl(job.Company) && (
                            <img 
                              src={getLogoUrl(job.Company)}
                              alt={`${job.Company} logo`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-600">{job.Company}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{job.Date}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(job.ID)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete job"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Interviewing</h2>
              <div className="space-y-3">
                {getJobsByStatus('interview').map((job) => (
                  <div key={job.ID} className="bg-white/90 p-3 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{job.Title}</h3>
                        <div className="flex items-center gap-2">
                          {getLogoUrl(job.Company) && (
                            <img 
                              src={getLogoUrl(job.Company)}
                              alt={`${job.Company} logo`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-600">{job.Company}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{job.Date}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(job.ID)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete job"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Offer</h2>
              <div className="space-y-3">
                {getJobsByStatus('offer').map((job) => (
                  <div key={job.ID} className="bg-white/90 p-3 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{job.Title}</h3>
                        <div className="flex items-center gap-2">
                          {getLogoUrl(job.Company) && (
                            <img 
                              src={getLogoUrl(job.Company)}
                              alt={`${job.Company} logo`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-600">{job.Company}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{job.Date}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(job.ID)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete job"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
            <table className="min-w-full bg-white/90 border border-gray-300">
              <thead>
                <tr className="bg-gray-100/80">
                  <th className="px-4 py-2 border">Company</th>
                  <th className="px-4 py-2 border">Title</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.ID} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2 border">
                      <div className="flex items-center gap-2">
                        {getLogoUrl(job.Company) && (
                          <img 
                            src={getLogoUrl(job.Company)}
                            alt={`${job.Company} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        {job.Company}
                      </div>
                    </td>
                    <td className="px-4 py-2 border">{job.Title}</td>
                    <td className="px-4 py-2 border">{job.Status}</td>
                    <td className="px-4 py-2 border">{job.Date}</td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() => handleDelete(job.ID)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete job"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;