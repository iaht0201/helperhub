import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SignalRContextType {
    connection: signalR.HubConnection | null;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (user && token) {
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(import.meta.env.VITE_CHAT_HUB_URL, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        } else {
            if (connection) {
                connection.stop();
                setConnection(null);
            }
        }
    }, [user, token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('SignalR Connected');
                    if (user) {
                        connection.invoke('JoinUserRoom', user.id);
                    }

                    connection.on('ReceiveNotification', (notification: any) => {
                        toast.success(
                            <div className="flex flex-col gap-1">
                                <p className="font-bold uppercase tracking-widest text-[10px] text-zinc-900">{notification.title}</p>
                                <p className="text-[9px] font-medium leading-relaxed uppercase text-slate-500">{notification.message}</p>
                            </div>,
                            { duration: 5000, icon: '🔔' }
                        );
                    });
                })
                .catch(error => console.error('SignalR Connection Error: ', error));

            return () => {
                connection.off('ReceiveNotification');
                connection.stop();
            };
        }
    }, [connection, user]);

    return (
        <SignalRContext.Provider value={{ connection }}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (context === undefined) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
};
