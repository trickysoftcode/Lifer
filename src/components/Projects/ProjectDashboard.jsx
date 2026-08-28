import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, FileText, Clock, X } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import './Projects.css';

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const { projects, addProject, deleteProject } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Get page counts for each project
  const pageCounts = useLiveQuery(async () => {
    const counts = {};
    for (const p of projects) {
      counts[p.id] = await db.projectPages.where('projectId').equals(p.id).count();
    }
    return counts;
  }, [projects]) || {};

  const handleCreate = async (e) => {
    e.preventDefault();
    if (title.trim()) {
      const id = await addProject({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      setShowModal(false);
      navigate(`/project/${id}`);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this project and all its pages?')) {
      deleteProject(id);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="projects-section" id="projects">
      <div className="projects-header">
        <div className="projects-title">
          <FolderKanban size={22} className="icon" />
          Projects
        </div>
      </div>

      <div className="projects-grid stagger-children">
        {projects.map(project => (
          <div
            key={project.id}
            className="project-tile"
            onClick={() => navigate(`/project/${project.id}`)}
            style={{ '--tile-color': project.color }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: project.color, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
            <button
              className="project-tile-delete"
              onClick={(e) => handleDelete(e, project.id)}
              aria-label="Delete project"
            >
              <X size={14} />
            </button>
            <div className="project-tile-icon">{project.icon}</div>
            <div className="project-tile-title">{project.title}</div>
            <div className="project-tile-desc">{project.description}</div>
            <div className="project-tile-stats">
              <span className="project-tile-stat">
                <FileText size={12} />
                {pageCounts[project.id] || 0} pages
              </span>
              <span className="project-tile-stat">
                <Clock size={12} />
                {formatDate(project.updatedAt)}
              </span>
            </div>
          </div>
        ))}

        <div className="new-project-tile" onClick={() => setShowModal(true)} id="new-project-btn">
          <div className="plus-icon">
            <Plus size={24} />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>New Project</span>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    className="input"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="My Awesome Project"
                    autoFocus
                    id="project-name-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="input"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's this project about?"
                    rows={3}
                    id="project-desc-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="create-project-btn">
                  <Plus size={16} /> Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
