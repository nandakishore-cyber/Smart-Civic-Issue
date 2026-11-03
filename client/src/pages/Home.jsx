import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaCamera,
  FaSearchLocation,
  FaCheckCircle,
  FaUserPlus,
  FaBullhorn,
  FaChartLine,
  FaHandshake,
  FaArrowRight,
  FaShieldAlt,
  FaUsers,
  FaClipboardCheck,
  FaCity,
} from 'react-icons/fa';

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Report Civic Issues.
            <br />
            <span className="hero-title-accent">Get Them Resolved.</span>
          </h1>
          <p className="hero-subtitle">
            A smart platform connecting citizens with local administration for faster issue
            resolution. Report problems in your community and track them until they&apos;re fixed.
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started <FaArrowRight />
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In
                </Link>
              </>
            ) : isAdmin ? (
              <Link to="/admin/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <FaArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/report" className="btn btn-primary btn-lg">
                  Report an Issue <FaArrowRight />
                </Link>
                <Link to="/dashboard" className="btn btn-outline btn-lg">
                  Track Your Issues
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-illustration">
          <div className="hero-illustration-graphic">
            <FaCity size={120} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose CivicReport?</h2>
          <p className="section-subtitle">
            Our platform makes it easy to report and track civic issues in your neighborhood
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon feature-icon-blue">
              <FaCamera size={28} />
            </div>
            <h3>Easy Reporting</h3>
            <p>
              Upload photos, add detailed descriptions, and pinpoint the exact location of civic
              issues in just a few clicks.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon feature-icon-green">
              <FaSearchLocation size={28} />
            </div>
            <h3>Real-time Tracking</h3>
            <p>
              Track the status of your reported issues in real-time. Get updates as your issue moves
              through the resolution pipeline.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon feature-icon-orange">
              <FaCheckCircle size={28} />
            </div>
            <h3>Quick Resolution</h3>
            <p>
              Issues are routed directly to the relevant government departments ensuring faster
              response and resolution times.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Four simple steps to get your civic issues resolved</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <FaUserPlus size={32} />
            </div>
            <h3>Register</h3>
            <p>Create your free account in seconds</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <FaBullhorn size={32} />
            </div>
            <h3>Report</h3>
            <p>Submit your issue with photos and location</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <FaChartLine size={32} />
            </div>
            <h3>Track</h3>
            <p>Monitor progress in real-time</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">
              <FaHandshake size={32} />
            </div>
            <h3>Resolved</h3>
            <p>Issue fixed by the concerned department</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-header">
          <h2 className="section-title section-title-light">Trusted by Citizens</h2>
          <p className="section-subtitle section-subtitle-light">
            Join thousands of citizens making their communities better
          </p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers size={28} />
            </div>
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Registered Citizens</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaClipboardCheck size={28} />
            </div>
            <div className="stat-number">25,000+</div>
            <div className="stat-label">Issues Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaCheckCircle size={28} />
            </div>
            <div className="stat-number">18,500+</div>
            <div className="stat-label">Issues Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaShieldAlt size={28} />
            </div>
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities Covered</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <FaShieldAlt size={24} />
            <span>CivicReport</span>
          </div>
          <p className="footer-text">
            &copy; {new Date().getFullYear()} CivicReport. All rights reserved. Making cities
            better, one issue at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
