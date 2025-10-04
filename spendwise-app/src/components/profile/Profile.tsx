import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, WorkExperience } from '../../types';
import { Briefcase, Mail, MapPin, Phone, User as UserIcon, Edit, Save, X, Plus, Trash2, Users } from 'lucide-react';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const Profile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();
    const { getUserById, updateUser, getAllUsersInCompany } = useData();
    const navigate = useNavigate();

    const viewedUser = useMemo(() => getUserById(userId || ''), [getUserById, userId]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User | null>(null);

    useEffect(() => {
        if (viewedUser) {
            setFormData(JSON.parse(JSON.stringify(viewedUser))); // Deep copy
        }
    }, [viewedUser, isEditing]);
    
    if (!viewedUser || !currentUser || !formData) {
        return <div className="text-center">User not found.</div>;
    }

    const companyUsers = getAllUsersInCompany(currentUser.companyId);
    const canEdit = currentUser.id === viewedUser.id;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const dataUrl = await fileToDataUrl(e.target.files[0]);
            setFormData({ ...formData, profilePhotoUrl: dataUrl });
        }
    };

    const handleWorkExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newWorkExperience = [...(formData.workExperience || [])];
        newWorkExperience[index] = { ...newWorkExperience[index], [e.target.name]: e.target.value };
        setFormData({ ...formData, workExperience: newWorkExperience });
    };
    
    const addWorkExperience = () => {
        const newWorkExperience: WorkExperience = { id: crypto.randomUUID(), jobTitle: '', companyName: '', startDate: '', endDate: '', description: '' };
        setFormData({ ...formData, workExperience: [...(formData.workExperience || []), newWorkExperience] });
    };

    const removeWorkExperience = (index: number) => {
        const newWorkExperience = (formData.workExperience || []).filter((_, i) => i !== index);
        setFormData({ ...formData, workExperience: newWorkExperience });
    };

    const handleFriendChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const friendId = e.target.value;
        if (friendId && !(formData.friendIds || []).includes(friendId) && friendId !== currentUser.id) {
            setFormData({...formData, friendIds: [...(formData.friendIds || []), friendId]});
        }
    };

    const removeFriend = (friendId: string) => {
        setFormData({...formData, friendIds: (formData.friendIds || []).filter(id => id !== friendId)});
    }

    const handleSave = () => {
        updateUser(formData);
        setIsEditing(false);
    };

    const inputStyle = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    
    const ProfileAvatar: React.FC<{ user: User, size: string }> = ({ user, size }) => {
        if (user.profilePhotoUrl) {
            return <img src={user.profilePhotoUrl} alt={user.name} className={`${size} rounded-full object-cover`} />;
        }
        const initial = user.name.charAt(0).toUpperCase();
        return (
            <div className={`${size} rounded-full flex items-center justify-center bg-blue-500 text-white font-bold text-4xl`}>
                {initial}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {isEditing ? (
                 <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"><X className="w-4 h-4 mr-2" />Cancel</button>
                        <button onClick={handleSave} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Save Changes</button>
                    </div>
                </div>
            ) : (
                canEdit && <div className="flex justify-end mb-4">
                    <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"><Edit className="w-4 h-4 mr-2" />Edit Profile</button>
                </div>
            )}
           
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Left Column */}
                <div className="md:col-span-1 space-y-6">
                    <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <div className="flex flex-col items-center">
                            <ProfileAvatar user={formData} size="w-32 h-32" />
                            {isEditing && <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="mt-4 text-sm"/>}
                            <h2 className="mt-4 text-2xl font-bold">{viewedUser.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{viewedUser.role}</p>
                        </div>
                    </div>
                     <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600">Contact Information</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center"><Mail className="w-4 h-4 mr-3 text-gray-400"/> {viewedUser.email}</li>
                            {isEditing ? (
                                <>
                                    <li><label className={labelStyle}>Phone</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleFormChange} className={inputStyle} placeholder="Your phone number" /></li>
                                    <li><label className={labelStyle}>Address</label><input type="text" name="address" value={formData.address || ''} onChange={handleFormChange} className={inputStyle} placeholder="City, Country" /></li>
                                </>
                            ) : (
                                <>
                                    <li className="flex items-center"><Phone className="w-4 h-4 mr-3 text-gray-400"/> {viewedUser.phone || 'Not provided'}</li>
                                    <li className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-gray-400"/> {viewedUser.address || 'Not provided'}</li>
                                </>
                            )}
                        </ul>
                    </div>
                     <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <h3 className="flex items-center text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600"><Users className="w-5 h-5 mr-2"/>My Friends</h3>
                        {isEditing && (
                            <div className="mb-4">
                                <label className={labelStyle}>Add Friend</label>
                                <select onChange={handleFriendChange} className={inputStyle} defaultValue="">
                                    <option value="" disabled>Select a colleague...</option>
                                    {companyUsers.filter(u => u.id !== currentUser.id && !(formData.friendIds || []).includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}
                        <ul className="space-y-3">
                           {(isEditing ? formData.friendIds : viewedUser.friendIds)?.map(friendId => {
                                const friend = getUserById(friendId);
                                if (!friend) return null;
                                return (
                                    <li key={friendId} className="flex items-center justify-between group">
                                        <Link to={`/profile/${friend.id}`} className="flex items-center gap-3 text-sm hover:underline">
                                           <ProfileAvatar user={friend} size="w-8 h-8"/>
                                            <span>{friend.name}</span>
                                        </Link>
                                        {isEditing && <button onClick={() => removeFriend(friend.id)} className="text-red-500 opacity-0 group-hover:opacity-100"><X className="w-4 h-4"/></button>}
                                    </li>
                                );
                           })}
                           {(!viewedUser.friendIds || viewedUser.friendIds.length === 0) && !isEditing && <p className="text-sm text-gray-500">No friends added yet.</p>}
                        </ul>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <h3 className="flex items-center text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600"><UserIcon className="w-5 h-5 mr-2"/>About Me</h3>
                        {isEditing ? (
                            <textarea name="about" value={formData.about || ''} onChange={handleFormChange} className={`${inputStyle} min-h-[100px]`} placeholder="Tell everyone a little about yourself..."/>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{viewedUser.about || 'No information provided.'}</p>
                        )}
                    </div>
                     <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <h3 className="flex items-center text-lg font-semibold border-b pb-2 mb-4 dark:border-gray-600"><Briefcase className="w-5 h-5 mr-2"/>Work Experience</h3>
                        <div className="space-y-6">
                            {(isEditing ? formData.workExperience : viewedUser.workExperience)?.map((exp, index) => (
                                <div key={exp.id} className="relative pl-6 border-l-2 dark:border-gray-600">
                                     <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5"></div>
                                    {isEditing ? (
                                        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <button onClick={() => removeWorkExperience(index)} className="absolute top-1 right-1 text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                                            <input type="text" name="jobTitle" value={exp.jobTitle} onChange={(e) => handleWorkExperienceChange(index, e)} placeholder="Job Title" className={inputStyle} />
                                            <input type="text" name="companyName" value={exp.companyName} onChange={(e) => handleWorkExperienceChange(index, e)} placeholder="Company Name" className={inputStyle} />
                                            <div className="flex gap-2">
                                                <input type="text" name="startDate" value={exp.startDate} onChange={(e) => handleWorkExperienceChange(index, e)} placeholder="Start Date (YYYY-MM)" className={inputStyle} />
                                                <input type="text" name="endDate" value={exp.endDate} onChange={(e) => handleWorkExperienceChange(index, e)} placeholder="End Date (YYYY-MM or Present)" className={inputStyle} />
                                            </div>
                                            <textarea name="description" value={exp.description} onChange={(e) => handleWorkExperienceChange(index, e)} placeholder="Description" className={inputStyle}></textarea>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-semibold">{exp.jobTitle}</p>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">{exp.companyName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{exp.startDate} - {exp.endDate}</p>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{exp.description}</p>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        {isEditing && <button onClick={addWorkExperience} className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:underline"><Plus className="w-4 h-4"/>Add Experience</button>}
                        {(!viewedUser.workExperience || viewedUser.workExperience.length === 0) && !isEditing && <p className="text-sm text-gray-500">No work experience added yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
