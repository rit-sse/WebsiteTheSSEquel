import AddProjectModal from '@/app/projects/AddProjectModal';
import { FC, useEffect, useState } from 'react';
import EditProjectModal from './EditProject';

type ProjectStrucure = {
    id: number;
    title: string;
    description: string;
    leadid: number;
    progress: string;
    repoLink: string;
    contentURL: string;
    projectImage: string;
    completed: boolean;
};

const ProjectTable: FC<{ isOfficer: boolean }> = ({ isOfficer }) => {

    const [projects, setProjects] = useState<ProjectStrucure[]>([]);
    const [users, setUsers] = useState<{ [id: number]: string }>({});
    const [addProjectModalEnabled, setAddProjectModalEnabled] = useState<boolean>(false);
    const [editProjectModalEnabled, setEditProjectModalEnabled] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<ProjectStrucure | null>(null);


    useEffect(() => {
        // Fetch projects from the API
        fetch('/api/project')
            .then(response => response.json())
            .then(data => {
                setProjects(data);
            });
        // Fetch users from the API
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                const userMap: { [id: number]: string } = {};
                data.forEach((user: { id: number; name: string }) => {
                    userMap[user.id] = user.name;
                });
                setUsers(userMap);
            });
    }, []);

    const reloadProjects = () => {
        fetch('/api/project')
            .then(response => response.json())
            .then(data => {
                setProjects(data);
            });
    };

    return (
        <div>
            {isOfficer ? <button className="bg-primary text-base-100 px-[25px] py-[10px] rounded-lg" onClick={() => setAddProjectModalEnabled(true)}>Add Project</button> : undefined}

            {projects.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No projects found.</div>
            ) : (
                <div className='w-full h-[350px] overflow-y-auto mt-[10px]'>
                    <table className="min-w-full divide-y divide-base-200">
                        <thead className="bg-base-50">
                            <tr>
                                <th className="px-4 py-2 w-[10px] text-left text-xs font-medium text-base-400 uppercase tracking-wider">#</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Title</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Lead</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Progress</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Repo</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Content</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Image</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Done</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-base-400 uppercase tracking-wider">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200">
                            {projects.map((project, idx) => (
                                <tr key={project.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-base-50'}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{project.id}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-base-400">{project.title}</td>
                                    <td className="px-4 py-3 max-w-xs truncate text-sm text-base-400">{project.description}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{users[project.leadid]}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {project.progress}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {project.repoLink ? (
                                            <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Repo</a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {project.contentURL ? (
                                            <a href={project.contentURL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Content</a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {project.projectImage ? (
                                            <span className="text-green-600 font-semibold">✓</span>
                                        ) : (
                                            <span className="text-green-600 font-semibold">❌</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {project.completed ? <span className="text-green-600 font-semibold">✓</span> : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => { setSelectedProject(project); setEditProjectModalEnabled(true) }}>
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AddProjectModal enabled={addProjectModalEnabled} setEnabled={setAddProjectModalEnabled} reloadOnAdd={false} />
            <EditProjectModal project={selectedProject} visible={editProjectModalEnabled} hideModal={() => setEditProjectModalEnabled(false)} triggerReload={reloadProjects} />
        </div>
    );
};

export default ProjectTable;
