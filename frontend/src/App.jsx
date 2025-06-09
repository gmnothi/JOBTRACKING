import React, { useState, useEffect } from 'react';
import { getJobs, deleteJob } from './api';
import './App.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isKanbanView, setIsKanbanView] = useState(false);
  const [dateSort, setDateSort] = useState('newest'); // 'newest' or 'oldest'

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

  // Sort jobs by date
  const sortJobs = (jobsList) => {
    return [...jobsList].sort((a, b) => {
      if (!a.Date) return 1;
      if (!b.Date) return -1;
      const dateA = new Date(a.Date);
      const dateB = new Date(b.Date);
      if (dateSort === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  };

  // Drag-and-drop handlers for Kanban
  const statusColumns = [
    { key: 'applied', label: 'Applied' },
    { key: 'interview', label: 'Interviewing' },
    { key: 'offer', label: 'Offer' },
  ];

  const getStatusKey = (status) => {
    const s = status.toLowerCase();
    if (s.startsWith('interview')) return 'interview';
    if (s.startsWith('offer')) return 'offer';
    return 'applied';
  };

  const jobsByStatus = statusColumns.reduce((acc, col) => {
    acc[col.key] = sortJobs(jobs.filter(job => getStatusKey(job.Status) === col.key));
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    const jobId = parseInt(draggableId);
    const destStatus = destination.droppableId;
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.ID === jobId ? { ...job, Status: destStatus.charAt(0).toUpperCase() + destStatus.slice(1) } : job
      )
    );
    // TODO: Call backend to persist status change
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
          <h1 className="text-5xl font-bold">
            <img src="/logos/toucanlogo.png" className="w-20 h-20 inline-block -mr-4" alt="Toucan Logo"></img>
            Toucan
          </h1>
          <button
            onClick={() => setIsKanbanView(!isKanbanView)}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/90 transition-colors animate-pulse hover:animate-none"
          >
            {isKanbanView ? 'Table View' : 'Kanban View'}
          </button>
        </div>

        {isKanbanView ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-3 gap-4">
              {statusColumns.map(col => (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300 min-h-[300px] ${snapshot.isDraggingOver ? 'ring-2 ring-purple-300' : ''}`}
                    >
                      <h2 className="text-lg font-semibold mb-4 text-gray-700">{col.label}</h2>
                      <div className="space-y-3">
                        {jobsByStatus[col.key].map((job, idx) => (
                          <Draggable draggableId={job.ID.toString()} index={idx} key={job.ID}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white/90 p-3 rounded-lg shadow hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${snapshot.isDragging ? 'ring-2 ring-purple-400' : ''}`}
                              >
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
                                    className="text-red-500 hover:text-red-700 transition-all duration-300 p-1 hover:scale-110 active:scale-95"
                                    title="Delete job"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <div className="overflow-x-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <table className="min-w-full bg-white/90 border border-gray-300">
              <thead>
                <tr className="bg-gray-100/80">
                  <th className="px-4 py-2 border">Company</th>
                  <th className="px-4 py-2 border">Title</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">
                    <div className="flex items-center gap-2">
                      Date
                      <select
                        value={dateSort}
                        onChange={e => setDateSort(e.target.value)}
                        className="ml-2 px-2 py-1 rounded border border-gray-300 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        style={{ minWidth: '110px' }}
                        title="Sort by date"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortJobs(jobs).map((job) => (
                  <tr key={job.ID} className="hover:bg-gray-50/80 transition-colors duration-300">
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
                        className="text-red-500 hover:text-red-700 transition-all duration-300 p-1 hover:scale-110 active:scale-95"
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