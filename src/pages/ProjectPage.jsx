import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import db from '../db/db';
import { useProjectPages } from '../hooks/useProjects';
import './ProjectPage.css';

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);

  const project = useLiveQuery(
    () => db.projects.get(numericId),
    [numericId]
  );

  const { pages, addPage, updatePage, deletePage } = useProjectPages(numericId);
  const [activePageId, setActivePageId] = useState(null);
  const [pageTitle, setPageTitle] = useState('');

  // Set first page as active when pages load
  useEffect(() => {
    if (pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].id);
      setPageTitle(pages[0].title);
    }
  }, [pages, activePageId]);

  const activePage = pages.find(p => p.id === activePageId);

  // Parse initial content for the editor
  const initialContent = useMemo(() => {
    if (!activePage?.content) return undefined;
    try {
      const parsed = JSON.parse(activePage.content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      // Not valid JSON, return undefined for default
    }
    return undefined;
  }, [activePageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useCreateBlockNote({
    initialContent,
  }, [activePageId]); // Recreate editor when page changes

  // Auto-save editor content
  useEffect(() => {
    if (!editor || !activePageId) return;

    const saveContent = () => {
      const blocks = editor.document;
      updatePage(activePageId, {
        content: JSON.stringify(blocks),
      });
    };

    // Listen for changes via editor.onChange
    editor.onChange(saveContent);

    // Cleanup: BlockNote doesn't expose an unsubscribe, so we just rely on
    // the editor being recreated via deps when activePageId changes
  }, [editor, activePageId, updatePage]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setPageTitle(newTitle);
    if (activePageId) {
      updatePage(activePageId, { title: newTitle });
    }
  };

  const handleAddPage = async () => {
    const newId = await addPage('Untitled Page');
    setActivePageId(newId);
    setPageTitle('Untitled Page');
  };

  const handleSelectPage = (page) => {
    setActivePageId(page.id);
    setPageTitle(page.title);
  };

  const handleDeletePage = async (e, pageId) => {
    e.stopPropagation();
    if (pages.length <= 1) return; // Don't delete last page
    await deletePage(pageId);
    if (activePageId === pageId) {
      const remaining = pages.filter(p => p.id !== pageId);
      if (remaining.length > 0) {
        setActivePageId(remaining[0].id);
        setPageTitle(remaining[0].title);
      }
    }
  };

  if (!project) {
    return (
      <div className="project-page">
        <div className="project-topbar">
          <div className="project-topbar-left">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
          </div>
        </div>
        <div className="project-editor-area" style={{ marginTop: 56 }}>
          <div className="editor-empty-state">
            <span className="icon">📁</span>
            <p>Project not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-page">
      {/* Top Bar */}
      <div className="project-topbar">
        <div className="project-topbar-left">
          <button className="back-btn" onClick={() => navigate('/')} id="back-to-dashboard">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <span className="project-topbar-icon">{project.icon}</span>
          <span className="project-topbar-title">{project.title}</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="project-sidebar">
        <div className="sidebar-label">Pages</div>
        {pages.map(page => (
          <button
            key={page.id}
            className={`sidebar-item ${activePageId === page.id ? 'active' : ''}`}
            onClick={() => handleSelectPage(page)}
          >
            <span className="page-icon"><FileText size={16} /></span>
            <span className="page-title">{page.title || 'Untitled'}</span>
            {pages.length > 1 && (
              <button
                className="delete-page-btn"
                onClick={(e) => handleDeletePage(e, page.id)}
              >
                <X size={12} />
              </button>
            )}
          </button>
        ))}
        <button className="add-page-btn" onClick={handleAddPage} id="add-page-btn">
          <Plus size={16} /> Add Page
        </button>
      </div>

      {/* Editor */}
      <div className="project-editor-area">
        {activePage ? (
          <>
            <input
              className="editor-page-title"
              type="text"
              value={pageTitle}
              onChange={handleTitleChange}
              placeholder="Untitled"
              id="page-title-input"
            />
            <div className="editor-container">
              <BlockNoteView editor={editor} theme="dark" />
            </div>
          </>
        ) : (
          <div className="editor-empty-state">
            <span className="icon">📝</span>
            <p>Select a page or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
