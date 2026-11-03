import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  FaBullhorn,
  FaUpload,
  FaMapMarkerAlt,
  FaTimesCircle,
  FaImage,
} from 'react-icons/fa';

const categories = [
  'Garbage Overflow',
  'Damaged Roads',
  'Water Leakage',
  'Street Lights',
  'Drainage',
  'Other',
];

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    priority: 'Medium',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationMessage, setLocationMessage] = useState('Requesting device location...');
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Device location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage('Device location captured.');
      },
      () => setLocationMessage('Location permission was not granted; typed address will still be saved.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e) => {
    handleImageChange(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const validate = () => {
    const { title, category, description, address, city, state, pincode } = formData;
    if (!title || !category || !description || !address || !city || !state || !pincode) {
      toast.error('All fields are required');
      return false;
    }
    if (description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return false;
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('priority', formData.priority);
      data.append('location[address]', formData.address);
      data.append('location[city]', formData.city);
      data.append('location[state]', formData.state);
      data.append('location[pincode]', formData.pincode);
      if (coordinates) {
        data.append('coordinates[latitude]', coordinates.latitude);
        data.append('coordinates[longitude]', coordinates.longitude);
      }
      if (image) {
        data.append('image', image);
      }

      await api.post('/issues', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Issue reported successfully! We will look into it.');
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Failed to report issue. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-container">
        <div className="report-header">
          <FaBullhorn size={32} className="report-header-icon" />
          <h1>Report a Civic Issue</h1>
          <p>Help improve your community by reporting civic issues</p>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          {/* Issue Details */}
          <div className="form-section">
            <h3 className="form-section-title">Issue Details</h3>

            <div className="form-group">
              <label htmlFor="title">Issue Title</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Broken street light on Main Road"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Provide a detailed description of the issue (minimum 20 characters)"
                rows={4}
                value={formData.description}
                onChange={handleChange}
              ></textarea>
              <span className="char-count">
                {formData.description.length}/20 characters minimum
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low - Routine issue</option>
                <option value="Medium">Medium - Needs attention</option>
                <option value="High">High - Gov. Officer handles directly</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h3 className="form-section-title">Upload Image</h3>
            {!imagePreview ? (
              <div
                className={`upload-area ${dragActive ? 'upload-area-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FaUpload size={36} className="upload-icon" />
                <p>Drag & drop an image here, or click to select</p>
                <span className="upload-hint">Supports: JPG, PNG, GIF (max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="upload-input"
                />
              </div>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={removeImage}
                >
                  <FaTimesCircle size={20} /> Remove
                </button>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h3 className="form-section-title">
              <FaMapMarkerAlt /> Location Details
            </h3>
            <p className="text-muted">{locationMessage}</p>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Street address or landmark"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pincode">Pincode</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span> Submitting...
              </>
            ) : (
              <>
                <FaBullhorn /> Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
