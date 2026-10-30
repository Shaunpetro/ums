// Path: ums-app/src/pages/Projects.tsx
// Purpose: Full-page Kanban board for Project workflows.

const COLUMNS = [
    { id: 'todo', title: 'To Do', count: 2 },
    { id: 'progress', title: 'In Progress', count: 1 },
    { id: 'review', title: 'Review', count: 1 },
    { id: 'done', title: 'Done', count: 1 }
];

export default function Projects() {
    return (
        <div className="projects-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Project Workflows</h1>
                    <p className="marker">Manage active pipelines, milestones, and deliverables.</p>
                </div>
                <button className="action-btn">New Project</button>
            </div>

            <div className="kanban-board">
                {COLUMNS.map(col => (
                    <div key={col.id} className="kanban-column">
                        <div className="kanban-header">
                            <span>{col.title}</span>
                            <span className="badge">{col.count}</span>
                        </div>
                        <div className="kanban-cards">
                            {col.id === 'todo' && (
                                <>
                                    <div className="kanban-card">
                                        <span className="badge warning" style={{ marginBottom: '8px' }}>High Priority</span>
                                        <h4>Draft North Shaft Proposal</h4>
                                        <div className="kanban-footer">
                                            <span className="marker">Due Tomorrow</span>
                                            <div className="mini-avatar" style={{ background: '#EB6F65' }}>P</div>
                                        </div>
                                    </div>
                                    <div className="kanban-card">
                                        <h4>Review Safety Protocols</h4>
                                        <div className="kanban-footer">
                                            <span className="marker">Due Oct 30</span>
                                            <div className="mini-avatar" style={{ background: '#4a3b6b' }}>S</div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {col.id === 'progress' && (
                                <div className="kanban-card">
                                    <h4>Ventilation System Design</h4>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }}></div></div>
                                    <div className="kanban-footer">
                                        <span className="marker">60% Complete</span>
                                        <div className="mini-avatar" style={{ background: '#2BB673' }}>A</div>
                                    </div>
                                </div>
                            )}
                            {col.id === 'review' && (
                                <div className="kanban-card">
                                    <h4>VSC Mining Invoice Q3</h4>
                                    <div className="kanban-footer">
                                        <span className="marker">Waiting on Client</span>
                                        <div className="mini-avatar" style={{ background: '#F5AB82' }}>S</div>
                                    </div>
                                </div>
                            )}
                            {col.id === 'done' && (
                                <div className="kanban-card" style={{ opacity: 0.6 }}>
                                    <h4 style={{ textDecoration: 'line-through' }}>Site Survey</h4>
                                    <div className="kanban-footer">
                                        <span className="marker">Completed Oct 20</span>
                                        <div className="mini-avatar" style={{ background: '#EB6F65' }}>P</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}