import React, { useState, useEffect, useRef, useMemo } from "react";
import "./MyIssues.css";
import { FiPlus, FiArrowLeft, FiMapPin, FiMic, FiTrash2, FiThumbsUp, FiThumbsDown, FiFilter } from "react-icons/fi";
import ngeohash from "ngeohash";

// Backend URL
const API_URL = "http://localhost:5000";

const ComplaintForm = ({ formData, setFormData, handleFormSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [locationStatus, setLocationStatus] = useState("");

  const handleFileChange = (e) => {
    setFormData({ ...formData, images: Array.from(e.target.files) });
  };

  const handleGetLocation = () => {
    setLocationStatus("Fetching location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const geohash = ngeohash.encode(latitude, longitude);
          setFormData({ ...formData, location: { latitude, longitude, geohash } });
          setLocationStatus("Location fetched!");
        },
        (error) => {
          setLocationStatus(`Error: ${error.message}`);
        }
      );
    } else {
      setLocationStatus("Geolocation is not supported by this browser.");
    }
  };

  const handleStartRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setFormData({ ...formData, audio_note: url });
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    });
  };

  const handleStopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const handleDeleteAudio = () => {
    setAudioURL(null);
    setFormData({ ...formData, audio_note: null });
    audioChunks.current = [];
  };

  return (
    <form onSubmit={handleFormSubmit} className="complaint-form">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input type="text" id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="location">Location</label>
        <div className="location-input">
          <input
            type="text"
            id="location"
            value={formData.location ? `${formData.location.latitude}, ${formData.location.longitude}` : ""}
            readOnly
            placeholder="Click the button to get your location"
          />
          <button type="button" onClick={handleGetLocation}><FiMapPin /></button>
        </div>
        {locationStatus && <p className="location-status">{locationStatus}</p>}
      </div>
      <div className="form-group">
        <label htmlFor="concerned_department">Concerned Department</label>
        <select id="concerned_department" value={formData.concerned_department} onChange={(e) => setFormData({ ...formData, concerned_department: e.target.value })} required>
          <option value="">Select Department</option>
          <option value="Electrical">Electrical</option>
          <option value="Water">Water</option>
          <option value="Municipal">Municipal</option>
          <option value="Garbage">Garbage</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="images">Upload Images</label>
        <input type="file" id="images" onChange={handleFileChange} multiple accept="image/*" />
      </div>
      <div className="form-group">
        <label>Audio Note</label>
        <div className="audio-note-controls">
          {!isRecording && !audioURL && <button type="button" onClick={handleStartRecording}><FiMic /> Start Recording</button>}
          {isRecording && <button type="button" onClick={handleStopRecording}>Stop Recording</button>}
          {audioURL && (
            <div className="audio-player">
              <audio src={audioURL} controls />
              <button type="button" onClick={handleDeleteAudio}><FiTrash2 /></button>
            </div>
          )}
        </div>
      </div>
      <button type="submit" className="submit-btn">Submit Complaint</button>
    </form>
  );
};

function MyIssues() {
  const [complaints, setComplaints] = useState([]);
  const [page, setPage] = useState("home"); // "home" | "register" | "detail"
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [sortBy, setSortBy] = useState("date_desc");
  const [filters, setFilters] = useState({ approved: null, status: null, tasklist_assigned: null, department: null });
  const [formData, setFormData] = useState({ title: "", description: "", location: null, concerned_department: "", images: [], audio_note: null });

  // Fetch complaints from backend
  useEffect(() => {
    fetch(`${API_URL}/complaints`)
      .then(res => res.json())
      .then(data => setComplaints(data))
      .catch(err => console.error("Error fetching complaints:", err));
  }, []);

  const handleRegisterClick = () => setPage("register");

  const handleOnComplaintCardClick = (id) => {
    const complaint = complaints.find(c => c._id === id);
    setSelectedComplaint(complaint);
    setPage("detail");
  };

  const handleBack = () => {
    setPage("home");
    setSelectedComplaint(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, date_of_publishing: new Date().toISOString(), status: "Pending", upvotes: 0, downvotes: 0 };

    const formDataToSend = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === "images") {
        value.forEach(file => formDataToSend.append("images", file));
      } else if (typeof value === "object") {
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        formDataToSend.append(key, value);
      }
    });

    fetch(`${API_URL}/complaints`, {
      method: "POST",
      body: formDataToSend
    })
      .then(res => res.json())
      .then(newComplaint => {
        setComplaints([...complaints, newComplaint]);
        setPage("home");
        setFormData({ title: "", description: "", location: null, concerned_department: "", images: [], audio_note: null });
      })
      .catch(err => console.error("Error submitting complaint:", err));
  };

  // The rest of filtering, sorting, voting logic stays the same, just ensure you use `_id` from MongoDB instead of `id`
  const filteredAndSortedComplaints = useMemo(() => {
    return complaints
      .filter(c => {
        if (filters.approved !== null && c.approved !== filters.approved) return false;
        if (filters.status !== null && c.status !== filters.status) return false;
        if (filters.tasklist_assigned !== null && c.tasklist_assigned !== filters.tasklist_assigned) return false;
        if (filters.department !== null && c.concerned_department !== filters.department) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date_asc": return new Date(a.date_of_publishing) - new Date(b.date_of_publishing);
          case "upvotes_desc": return b.upvotes - a.upvotes;
          case "status": return a.status.localeCompare(b.status);
          default: return new Date(b.date_of_publishing) - new Date(a.date_of_publishing);
        }
      });
  }, [complaints, filters, sortBy]);


  return (
    <div className="my-issues-page">
      {page === "home" && (
        <>
          <header className="header">
            <h2>Hello, User</h2>
            <p>Welcome back, here are your registered complaints.</p>
          </header>

          <div className="register-section">
            <button className="register-btn" onClick={handleRegisterClick}>
              <FiPlus /> Register a Complaint
            </button>
          </div>

          <div className="filters-section">
                <div className="filter-group">
                    <button onClick={() => handleFilterChange('approved', true)} className={filters.approved === true ? 'active' : ''}>Approved</button>
                    <button onClick={() => handleFilterChange('approved', false)} className={filters.approved === false ? 'active' : ''}>Not Approved</button>
                </div>
                 <div className="filter-group">
                    <button onClick={() => handleFilterChange('status', 'Pending')} className={filters.status === 'Pending' ? 'active' : ''}>Pending</button>
                    <button onClick={() => handleFilterChange('status', 'Resolved')} className={filters.status === 'Resolved' ? 'active' : ''}>Resolved</button>
                </div>
                <div className="filter-group">
                    <button onClick={() => handleFilterChange('tasklist_assigned', true)} className={filters.tasklist_assigned === true ? 'active' : ''}>Tasklist Assigned</button>
                    <button onClick={() => handleFilterChange('tasklist_assigned', false)} className={filters.tasklist_assigned === false ? 'active' : ''}>No Tasklist</button>
                </div>
                <div className="sort-options">
                    <FiFilter />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="upvotes_desc">Most Upvoted</option>
                        <option value="status">By Status</option>
                    </select>
                </div>
                 <div className="sort-options">
                    <FiFilter />
                    <select value={filters.department || ''} onChange={(e) => handleFilterChange('department', e.target.value || null)}>
                        <option value="">All Departments</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Water">Water</option>
                        <option value="Municipal">Municipal</option>
                        <option value="Garbage">Garbage</option>
                    </select>
                </div>
            </div>


          <section className="complaints-list">
            <h3>Your Complaints</h3>
            {filteredAndSortedComplaints.length === 0 ? (
              <p className="no-complaints">No complaints match your filters.</p>
            ) : (
                filteredAndSortedComplaints.map((c) => (
                <div
                  key={c.id}
                  className="complaint-card"
                >
                  <div onClick={() => handleOnComplaintCardClick(c.id)} >
                  <h4>{c.title}</h4>
                  <p className="description">{c.description}</p>
                  <p>
                    <b>Location:</b> {c.location.latitude}, {c.location.longitude}
                  </p>
                  <p className={`department ${c.concerned_department.toLowerCase()}`}>
                    {c.concerned_department}
                  </p>
                  <p className={`status ${c.status.toLowerCase()}`}>
                    {c.status}
                  </p>
                   <p className={c.approved ? 'approved' : 'not-approved'}>{c.approved ? 'Approved' : 'Not Approved'}</p>
                   <p>Published: {c.date_of_publishing} at {c.time_published}</p>
                  </div>
                   <div className="vote-buttons">
                    <button onClick={() => handleUpvote(c.id)}><FiThumbsUp /> {c.upvotes}</button>
                    <button onClick={() => handleDownvote(c.id)}><FiThumbsDown /> {c.downvotes}</button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {page === "register" && (
        <div className="register-page">
          <header className="page-header">
            <button onClick={handleBack}>
              <FiArrowLeft />
            </button>
            <h2>Register Complaint</h2>
          </header>
          <ComplaintForm
            formData={formData}
            setFormData={setFormData}
            handleFormSubmit={handleFormSubmit}
          />
        </div>
      )}

      {page === "detail" && selectedComplaint && (
        <div className="complaint-detail-page">
          <header className="page-header">
            <button onClick={handleBack}>
              <FiArrowLeft />
            </button>
            <h2>{selectedComplaint.title}</h2>
          </header>
          <div className="complaint-detail-content">
            <p className="description">{selectedComplaint.description}</p>
            <p>
              <b>Location:</b> <a href={`https://www.google.com/maps/search/?api=1&query=${selectedComplaint.location.latitude},${selectedComplaint.location.longitude}`} target="_blank" rel="noopener noreferrer">{selectedComplaint.location.latitude}, {selectedComplaint.location.longitude}</a>
            </p>
            <p className={`department ${selectedComplaint.concerned_department.toLowerCase()}`}>
                    {selectedComplaint.concerned_department}
            </p>
            <p className={`status ${selectedComplaint.status.toLowerCase()}`}>
              {selectedComplaint.status}
            </p>
             <p className={selectedComplaint.approved ? 'approved' : 'not-approved'}>{selectedComplaint.approved ? 'Approved' : 'Not Approved'}</p>
             <p>Published: {selectedComplaint.date_of_publishing} at {selectedComplaint.time_published}</p>
            <div className="image-gallery">
              {selectedComplaint.images.map((image, index) => (
                <img key={index} src={image} alt={`Complaint Image ${index + 1}`} />
              ))}
            </div>
             {selectedComplaint.audio_note && <div className="audio-player-detail"><audio src={selectedComplaint.audio_note} controls /></div>}
            {selectedComplaint.tasklist_assigned && (
              <div className="tasklist">
                <h4>Tasklist</h4>
                <ul>
                  {selectedComplaint.tasklist.map((task, index) => (
                    <li key={index}>
                      <input type="checkbox" checked={task.checked} onChange={() => handleTasklistChange(selectedComplaint.id, index)} />
                      {task.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="department-response">
                <h4>Department Response</h4>
                <p>{selectedComplaint.department_response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default MyIssues;
