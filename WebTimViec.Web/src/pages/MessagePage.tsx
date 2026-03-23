import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, MoreVertical, Smartphone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { messageApi } from '../api';
import * as signalR from '@microsoft/signalr';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const MessagePage: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [inbox, setInbox] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    // Initial effect to fetch inbox
    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const response = await messageApi.getInbox();
                const rawMessages = response.data || [];
                
                // Group by (OtherUser, JobPost)
                const uniqueConversations: any[] = [];
                const seenKeys = new Set();

                rawMessages.forEach((msg: any) => {
                    const otherId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
                    const key = `${otherId}-${msg.jobPostId}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        uniqueConversations.push(msg);
                    }
                });

                setInbox(uniqueConversations);
            } catch (err) { console.error(err); }
        };
        fetchInbox();
    }, [user?.id]);

    // SignalR Connection setup
    useEffect(() => {
        if (!user) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_CHAT_HUB_URL || 'http://localhost:5281/chathub', {
                accessTokenFactory: () => localStorage.getItem('token') || ''
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [user]);

    // SignalR Listeners and Joining Room
    useEffect(() => {
        if (!connection || !user) return;

        connection.start()
            .then(() => {
                console.log('SignalR Connected!');
                connection.invoke('JoinUserRoom', user.id);
                
                connection.on('ReceiveMessage', (msg: Message) => {
                    // Only append if it's from the current active chat or updates our inbox
                    if (activeChat && (msg.senderId === activeChat.senderId || msg.senderId === activeChat.receiverId)) {
                        setMessages(prev => [...prev, msg]);
                    }
                    // Refresh inbox when new message arrives
                    messageApi.getInbox().then(res => {
                        const unique = res.data.filter((v: any, i: any, a: any) => 
                            a.findIndex((t: any) => (t.receiverId === v.receiverId && t.senderId === v.senderId)) === i
                        );
                        setInbox(unique);
                    });
                });
            })
            .catch(err => console.error('SignalR Connection Error: ', err));

        return () => {
            connection.off('ReceiveMessage');
        };
    }, [connection, user, activeChat]);

    // Fetch conversation when activeChat changes
    useEffect(() => {
        const fetchConversation = async () => {
            if (!activeChat) return;
            try {
                const otherId = activeChat.senderId === user?.id ? activeChat.receiverId : activeChat.senderId;
                const response = await messageApi.getConversation(activeChat.jobPostId, otherId);
                setMessages(response.data);
            } catch (err) { console.error(err); }
        };
        fetchConversation();
    }, [activeChat, user]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !activeChat) return;

        try {
            const otherId = activeChat.senderId === user?.id ? activeChat.receiverId : activeChat.senderId;
            const response = await messageApi.sendMessage({
                receiverId: otherId,
                jobId: activeChat.jobPostId,
                content: content
            });
            setMessages([...messages, response.data]);
            setContent('');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 h-[100vh]">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex h-full overflow-hidden">
                {/* Sidebar Inbox */}
                <aside className="w-80 md:w-96 border-r border-slate-50 flex flex-col">
                    <div className="p-8 border-b border-slate-50">
                        <h2 className="text-3xl font-semibold text-primary-600 mb-2">Nhắn tin</h2>
                        <div className="flex bg-slate-100 p-2 rounded-2xl">
                             <div className="bg-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-2"> <span>Tất cả</span> <div className="w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">3</div> </div>
                             <div className="px-4 py-2 text-xs font-bold text-slate-400">Chưa đọc</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {inbox.map((chat) => {
                            const isMe = chat.senderId === user?.id;
                            const other = isMe ? chat.receiver : chat.sender;
                            const otherName = other?.fullName || 'Người dùng';
                            
                            return (
                                <motion.div 
                                    key={`${other?.id || chat.id}-${chat.jobPostId}`}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setActiveChat(chat)}
                                    className={`p-6 rounded-3xl cursor-pointer transition-all border ${activeChat?.id === chat.id ? 'bg-primary-50 border-primary-100 shadow-lg shadow-primary-100/50' : 'bg-white hover:bg-slate-50 border-transparent shadow-sm'}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-white text-primary-600 rounded-2xl flex items-center justify-center font-semibold shadow-sm text-xl uppercase border border-slate-100">
                                            {otherName.charAt(0)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-semibold text-slate-800 tracking-tight truncate">{otherName}</h4>
                                                <span className="text-xs text-slate-400 uppercase font-semibold">
                                                    {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium truncate ">{chat.content}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </aside>

                {/* Chat Main Area */}
                <main className="flex-1 flex flex-col bg-slate-50/50">
                    {activeChat ? (
                        <>
                            <header className="p-8 bg-white border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-semibold">
                                       {activeChat.senderId === user?.id ? activeChat.receiver?.fullName.charAt(0) : activeChat.sender?.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight leading-none mb-1">
                                            {activeChat.senderId === user?.id ? activeChat.receiver?.fullName : activeChat.sender?.fullName}
                                        </h3>
                                        <div className="flex items-center space-x-2 text-xs uppercase font-semibold tracking-widest text-primary-500">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> <span>Đang hoạt động</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 shadow-sm transition-all"><Smartphone size={20} /></button>
                                    <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 shadow-sm transition-all"><Info size={20} /></button>
                                    <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 shadow-sm transition-all"><MoreVertical size={20} /></button>
                                </div>
                            </header>

                            <div className="flex-1 p-10 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-primary-100 scrollbar-track-transparent">
                                <AnimatePresence initial={false}>
                                    {messages.map((m) => (
                                        <motion.div 
                                            key={m.id}
                                            initial={{ opacity: 0, x: m.senderId === user?.id ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] p-6 rounded-3xl font-medium text-sm border shadow-sm ${
                                                m.senderId === user?.id 
                                                ? 'bg-primary-600 text-white border-primary-500 rounded-br-none' 
                                                : 'bg-white text-slate-700 border-slate-100 rounded-bl-none'
                                            }`}>
                                                {m.content}
                                                <div className={`mt-2 text-[8px] font-semibold uppercase tracking-widest ${m.senderId === user?.id ? 'text-primary-200' : 'text-slate-300'}`}>
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={scrollRef} />
                            </div>

                            <footer className="p-10 bg-white border-t border-slate-50">
                                <form onSubmit={handleSend} className="relative group">
                                    <input 
                                        type="text" 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Nhập nội dung tin nhắn..."
                                        className="w-full pl-12 pr-20 py-5 bg-slate-100 border-none rounded-[2rem] font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><MessageCircle size={20} /></div>
                                    <button 
                                        type="submit"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary p-3 rounded-2xl flex items-center justify-center transform group-hover:scale-110 active:scale-95"
                                    >
                                        <Send size={20} fill="currentColor" />
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                             <div className="w-56 h-56 bg-slate-100 rounded-[5rem] flex items-center justify-center mb-10"><MessageCircle size={120} className="text-slate-300" strokeWidth={1} /></div>
                             <h3 className="text-4xl font-semibold text-zinc-900 mb-4 tracking-tighter">Bắt đầu trò chuyện</h3>
                             <p className="max-w-xs text-slate-500 font-bold uppercase tracking-widest text-xs">Vui lòng chọn một cuộc hội thoại từ danh sách bên trái hoặc liên hệ ứng viên từ trang chi tiết.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MessagePage;
