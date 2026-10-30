// Path: ums-app/src/pages/Tasks.tsx
// Purpose: Task management list with checkboxes, priorities, and HubSpot-style analytics charts.

import { Check } from 'lucide-react';

const MOCK_TASKS = [
    { id: 1, title: 'Review Tender Docs', associated: 'North Shaft Expansion', due: 'Today', priority: 'High', assignee: 'P', color: '#EB6F65', completed: false },
    { id: 2, title: 'Update CRM Records for Q4', associated: 'ATG DesEng', due: 'Tomorrow', priority: 'Medium', assignee: 'S', color: '#4a3b6b', completed: false },
    { id: 3, title: 'Send Follow-up to VSC Mining', associated: 'INV-2026-088', due: 'Overdue by 2 days', priority: 'High', assignee: 'P', color: '#EB6F65', completed: false, overdue: true },
    { id: 4, title: 'Sync File Server', associated: 'General', due: 'Completed', priority: 'Low', assignee: 'A', color: '#2BB673', completed: true },
];

export default function Tasks() {
    return (
        <div className="tasks-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Task Management</h1>
                    <p className="marker">All assigned action items and CRM follow-ups.</p>
                </div>
                <button className="action-btn">Create Task</button>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tasks Due Today</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>3</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Overdue</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-danger)' }}>1</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed (This Week)</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-success)' }}>12</h2>
                </div>
            </div>

            {/* Task List */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="task-list">
                    {MOCK_TASKS.map(task => (
                        <div key={task.id} className="task-item" style={{ opacity: task.completed ? 0.5 : 1 }}>
                            <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                                {task.completed && <Check size={14} color="white" />}
                            </div>
                            <div className="task-content">
                                <h4 style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</h4>
                                <span className="marker" style={{ color: task.overdue ? 'var(--ubv-danger)' : 'var(--ubv-text-muted)' }}>
                                    Associated: {task.associated} | {task.overdue ? task.due : `Due: ${task.due}`}
                                </span>
                            </div>
                            <div className="task-meta">
                                <span className={`badge ${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success'}`}>{task.priority}</span>
                                <div className="mini-avatar" style={{ background: task.color }}>{task.assignee}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analytics Section (HubSpot Style) */}
            <div className="analytics-section">
                
                {/* 1. Task Completion Trend */}
                <div className="glass-panel analytics-card">
                    <h3>Task Completion Trend</h3>
                    <div className="bar-chart">
                        <div className="bar-group">
                            <div className="bar" style={{ height: '30%', background: 'rgba(128, 128, 128, 0.3)' }}></div>
                            <span className="bar-label">Mon</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar" style={{ height: '50%', background: 'rgba(128, 128, 128, 0.3)' }}></div>
                            <span className="bar-label">Tue</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar" style={{ height: '80%', background: 'var(--ubv-brand-gradient)' }}></div>
                            <span className="bar-label">Wed</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar" style={{ height: '45%', background: 'rgba(128, 128, 128, 0.3)' }}></div>
                            <span className="bar-label">Thu</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar" style={{ height: '95%', background: 'var(--ubv-brand-gradient)' }}></div>
                            <span className="bar-label">Fri</span>
                        </div>
                    </div>
                </div>

                {/* 2. Tasks by Priority */}
                <div className="glass-panel analytics-card">
                    <h3>Tasks by Priority</h3>
                    <div>
                        <div className="priority-row">
                            <span className="marker" style={{ fontWeight: 500 }}>High Priority</span>
                            <span className="marker">5 tasks</span>
                        </div>
                        <div className="priority-bar-bg">
                            <div className="priority-bar-fill" style={{ width: '45%', background: 'var(--ubv-danger)' }}></div>
                        </div>

                        <div className="priority-row">
                            <span className="marker" style={{ fontWeight: 500 }}>Medium Priority</span>
                            <span className="marker">8 tasks</span>
                        </div>
                        <div className="priority-bar-bg">
                            <div className="priority-bar-fill" style={{ width: '70%', background: 'var(--ubv-warning)' }}></div>
                        </div>

                        <div className="priority-row">
                            <span className="marker" style={{ fontWeight: 500 }}>Low Priority</span>
                            <span className="marker">3 tasks</span>
                        </div>
                        <div className="priority-bar-bg">
                            <div className="priority-bar-fill" style={{ width: '20%', background: 'var(--ubv-success)' }}></div>
                        </div>
                    </div>
                </div>

                {/* 3. Team Workload */}
                <div className="glass-panel analytics-card">
                    <h3>Team Workload</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                        <div className="flex-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="mini-avatar" style={{ background: '#EB6F65', width: '32px', height: '32px', fontSize: '14px' }}>P</div>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Petro Malamule</span>
                            </div>
                            <span className="badge warning">4 Tasks</span>
                        </div>
                        <div className="flex-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="mini-avatar" style={{ background: '#4a3b6b', width: '32px', height: '32px', fontSize: '14px' }}>S</div>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Shaun Mckoy</span>
                            </div>
                            <span className="badge success">2 Tasks</span>
                        </div>
                        <div className="flex-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="mini-avatar" style={{ background: '#2BB673', width: '32px', height: '32px', fontSize: '14px' }}>A</div>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Dev Team</span>
                            </div>
                            <span className="badge danger">6 Tasks</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}