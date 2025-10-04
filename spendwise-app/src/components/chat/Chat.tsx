import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ChatMessage } from '../../types';
// FIX: Added 'Briefcase' to lucide-react imports.
import { Send, MessageSquare, Users, Building, User as UserIcon, Briefcase } from 'lucide-react';

interface ChatChannel {
    id: string;
    name: string;
    type: 'company' | 'team' | 'dm';
    icon: React.ReactNode;
}

const Avatar: React.FC<{ name: string }> = ({ name }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const colors = ['bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-blue-500'];
    // Simple hash to get a consistent color
    const colorIndex = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return (
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${colors[colorIndex]}`}>
            {initial}
        </div>
    );
};

const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};


const Chat: React.FC = () => {
    const { user } = useAuth();
    const { users, getUserById, getMessagesForChannel, addMessage } = useData();
    const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const channels = useMemo<ChatChannel[]>(() => {
        if (!user) return [];
        const userChannels: ChatChannel[] = [];

        userChannels.push({ id: `company_${user.companyId}`, name: 'Company Wide', type: 'company', icon: <Building className="w-4 h-4 mr-2" /> });

        if (user.managerId) {
            const manager = getUserById(user.managerId);
            if (manager) {
                const ids = [user.id, user.managerId].sort();
                userChannels.push({ id: `dm_${ids[0]}_${ids[1]}`, name: `${manager.name}`, type: 'dm', icon: <UserIcon className="w-4 h-4 mr-2" /> });
            }
        }
        
        const myTeam = users.filter(u => u.managerId === user.id);
        if (myTeam.length > 0) {
            userChannels.push({ id: `team_${user.id}`, name: 'My Team', type: 'team', icon: <Users className="w-4 h-4 mr-2" /> });
        }

        if (user.managerId) {
            const manager = getUserById(user.managerId);
            const teamChannelId = `team_${user.managerId}`;
            // Add team channel only if it's not the one they manage
            if (teamChannelId !== `team_${user.id}`) {
                userChannels.push({
                    id: teamChannelId,
                    name: manager ? `${manager.name}'s Team` : 'My Team',
                    type: 'team',
                    icon: <Briefcase className="w-4 h-4 mr-2" />
                });
            }
        }
    
        return Array.from(new Map(userChannels.map(item => [item.id, item])).values());
    }, [user, users, getUserById]);
    
    useEffect(() => {
        if (channels.length > 0 && !activeChannel) {
            setActiveChannel(channels[0]);
        }
    }, [channels, activeChannel]);
    
    const messages = activeChannel ? getMessagesForChannel(activeChannel.id) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeChannel]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !activeChannel || !user) return;
        
        addMessage({
            channelId: activeChannel.id,
            content: newMessage,
            senderId: user.id,
            senderName: user.name,
            timestamp: new Date().toISOString()
        });
        setNewMessage('');
    };
    
    const renderMessages = () => {
        if (!activeChannel) return null;
        if (messages.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-4"/>
                    <h3 className="font-semibold">Welcome to #{activeChannel.name}</h3>
                    <p className="text-sm">This is the beginning of the conversation. Say hello!</p>
                </div>
            )
        }

        const messageElements: React.ReactNode[] = [];
        let lastDate: string | null = null;
        
        messages.forEach((msg, index) => {
            const currentDate = new Date(msg.timestamp).toDateString();
            if (currentDate !== lastDate) {
                messageElements.push(
                    <div key={`date-${currentDate}`} className="relative my-4 text-center">
                        <hr className="absolute w-full top-1/2 -translate-y-1/2 border-gray-200 dark:border-gray-600"/>
                        <span className="relative px-2 text-xs font-semibold text-gray-500 bg-white dark:bg-gray-800">{formatDateSeparator(currentDate)}</span>
                    </div>
                );
                lastDate = currentDate;
            }

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60 * 1000;
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime() > 5 * 60 * 1000;

            messageElements.push(
                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}>
                    {msg.senderId !== user?.id && (
                        <div className="self-end w-8">
                           {isLastInGroup && <Avatar name={msg.senderName} />}
                        </div>
                    )}
                    <div className={`flex flex-col max-w-xs md:max-w-md ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                       {isFirstInGroup && msg.senderId !== user?.id && <p className="text-xs text-gray-500 dark:text-gray-400 ml-3 mb-0.5">{msg.senderName}</p>}
                       <div className={`px-3 py-2 text-sm ${msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
                          ${isFirstInGroup && isLastInGroup ? 'rounded-xl' : ''}
                          ${!isFirstInGroup && !isLastInGroup ? `rounded-md ${msg.senderId === user?.id ? 'rounded-r-xl' : 'rounded-l-xl'}` : ''}
                          ${isFirstInGroup && !isLastInGroup ? `rounded-t-xl ${msg.senderId === user?.id ? 'rounded-l-xl' : 'rounded-r-xl'}` : ''}
                          ${!isFirstInGroup && isLastInGroup ? `rounded-b-xl ${msg.senderId === user?.id ? 'rounded-l-xl' : 'rounded-r-xl'}` : ''}
                       `}>
                           {msg.content}
                       </div>
                       {isLastInGroup && <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                   </div>
                </div>
            );
        });

        return messageElements;
    }


    if (!user) return null;

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col">
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Chat</h1>
            <div className="flex flex-grow overflow-hidden bg-white border rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                {/* Left Panel: Channels */}
                <div className="w-1/3 border-r md:w-1/4 dark:border-gray-700">
                    <div className="p-4 font-bold border-b dark:border-gray-700">Channels</div>
                    <ul className="overflow-y-auto">
                        {channels.map(channel => (
                            <li key={channel.id}
                                onClick={() => setActiveChannel(channel)}
                                className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeChannel?.id === channel.id ? 'bg-blue-50 dark:bg-blue-900/50 font-semibold text-blue-700 dark:text-blue-300' : ''}`}
                            >
                                {channel.icon} {channel.name}
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Right Panel: Chat Window */}
                <div className="flex flex-col flex-1">
                    {activeChannel ? (
                        <>
                            <div className="flex items-center p-4 font-bold text-gray-800 bg-gray-50 border-b dark:bg-gray-900 dark:text-white dark:border-gray-700">{activeChannel.icon} {activeChannel.name}</div>
                            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                                {renderMessages()}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="flex p-4 bg-gray-50 border-t dark:bg-gray-900 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Message in ${activeChannel.name}`}
                                    className="flex-1 p-2 border border-gray-300 rounded-l-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700 disabled:bg-blue-400" disabled={!newMessage.trim()}>
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                           <MessageSquare className="w-16 h-16 mb-4"/>
                           <p>Select a channel to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
