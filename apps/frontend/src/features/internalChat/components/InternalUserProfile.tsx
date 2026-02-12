import React from 'react';
import { 
  Camera, 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  Calendar, 
  Mail, 
  Shield, 
  ArrowLeft,
  ChevronRight,
  Volume2
} from 'lucide-react';

interface InternalUserProfileProps {
  onBack: () => void;
  user?: {
    name: string;
    avatar: string;
    bio?: string;
    joinedDate?: string;
    stats?: {
      conversations: number;
      booksRead: number;
      mentions: number;
    }
  };
}

export const InternalUserProfile: React.FC<InternalUserProfileProps> = ({ 
  onBack,
  user = {
    name: 'Explorador Literário',
    avatar: 'https://i.pravatar.cc/150?u=me',
    bio: 'Entusiasta de mensagens instantâneas e arquitetura de software.',
    joinedDate: 'Jan 2024',
    stats: {
      conversations: 42,
      booksRead: 12,
      mentions: 156
    }
  }
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F3F6F9] overflow-y-auto font-['Inter'] animate-in fade-in duration-300">
      {/* Header do Perfil */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="font-bold text-[#1e293b] text-lg">Meu Perfil</h2>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-8 pb-12">
        {/* Card Principal */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full border-4 border-white shadow-lg hover:bg-blue-700 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">{user.name}</h1>
              <p className="text-blue-600 font-semibold text-sm mt-1">Nível: Arquiteto de Software</p>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              {user.bio}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <span className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-100 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Desde {user.joinedDate}
              </span>
              <span className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Conta Verificada
              </span>
            </div>
          </div>
        </section>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="p-4 bg-orange-50 rounded-2xl mb-4">
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e293b]">{user.stats?.conversations}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Conversas</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="p-4 bg-blue-50 rounded-2xl mb-4">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e293b]">{user.stats?.booksRead}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Projetos</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="p-4 bg-green-50 rounded-2xl mb-4">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e293b]">{user.stats?.mentions}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Conquistas</p>
          </div>
        </div>

        {/* Configurações Rápidas */}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-gray-800">Configurações</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Notificações', desc: 'Gerencie alertas de mensagens', icon: Volume2 },
              { label: 'Privacidade', desc: 'Quem pode ver seu perfil', icon: Shield },
              { label: 'Tema', desc: 'Aparência do aplicativo', icon: BookOpen },
              { label: 'E-mail', desc: 'Preferências de contato', icon: Mail },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="w-full flex items-center p-6 hover:bg-gray-50 transition-colors group">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all mr-4">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
