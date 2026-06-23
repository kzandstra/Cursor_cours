import { useRef, useState, useEffect } from 'react';
import { Send, MapPin, Truck, ChevronRight, Package, Search, Upload, X } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const MOCK_DB = [
  {
    id: "1",
    name: "Sable Roulé Lavé 0/4",
    price: "18.50",
    unit: "la Tonne",
    city: "Lyon (Fournisseur EQI)",
    category: "Sables & Graviers"
  },
  {
    id: "2",
    name: "Grave Non Traitée (GNT) 0/31.5",
    price: "12.20",
    unit: "la Tonne",
    city: "Carrière de Pusignan",
    category: "Matériaux de Remblai"
  },
  {
    id: "3",
    name: "Béton Prêt à l'Emploi (C25/30)",
    price: "95.00",
    unit: "le m³",
    city: "Centrale Lyon Est",
    category: "Bâtiment"
  },
  {
    id: "4",
    name: "Grave Bitume 0/14",
    price: "68.00",
    unit: "la Tonne",
    city: "Poste d'Enrobage Vénissieux",
    category: "Enrobés"
  }
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  product?: typeof MOCK_DB[0];
  products?: typeof MOCK_DB;
}


type AccessRow = {
  role: 'admin' | 'user' | 'readonly';
  is_active: boolean;
  full_name: string | null;
  email: string;
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Bonjour ! Je suis l'Assistant Prix Devis d'Evariste. Quel prix de matériau (au devis) recherchez-vous aujourd'hui ?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessRow | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState<'none' | 'email' | 'signup' | 'google' | 'logout'>('none');


  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError(error.message);
      }
      setSessionUserId(data.session?.user.id ?? null);
      setAuthLoading(false);
    };
    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null);
      setAuthError(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadAccess = async () => {
      if (!sessionUserId) {
        setAccess(null);
        return;
      }

      const { data, error } = await supabase
        .from('access')
        .select('role,is_active,full_name,email')
        .eq('user_id', sessionUserId)
        .single();

      if (error) {
        setAuthError(`Compte connecté, mais profil access introuvable: ${error.message}`);
        setAccess(null);
        return;
      }

      setAccess(data as AccessRow);
    };

    void loadAccess();
  }, [sessionUserId]);

  const handleEmailSignIn = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthActionLoading('email');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Erreur de connexion email.');
    } finally {
      setAuthActionLoading('none');
    }
  };

  const handleEmailSignUp = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthActionLoading('signup');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (!data.session) {
        setAuthInfo('Compte créé. Vérifiez votre email pour confirmer votre inscription.');
      } else {
        setAuthInfo('Compte créé et connecté.');
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Erreur lors de la création du compte.');
    } finally {
      setAuthActionLoading('none');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthActionLoading('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Erreur Google OAuth.');
      setAuthActionLoading('none');
    }
  };

  const handleSignOut = async () => {
    setAuthInfo(null);
    setAuthError(null);
    setAuthActionLoading('logout');
    await supabase.auth.signOut();
    setAccess(null);
    setSessionUserId(null);
    setAuthActionLoading('none');
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    try {
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes("liste") || lowerText.includes("tout") || lowerText.includes("tous les prix")) {
        // Jointure avec la table offres_prix (produits.id = offres_prix.produit_id)
        const { data, error } = await supabase.from('produits').select('*, offres_prix(*)').limit(50);
        
        if (error) throw error;
        
        const mappedProducts = (data || []).map((p: any) => {
          const offres = p.offres_prix || [];
          
          let bestOffre = null;
          if (offres.length > 0) {
            const firstOffre = offres[0];
            // On gère les différents noms de colonnes qui pourraient exister pour le prix dans offres_prix
            bestOffre = firstOffre.prix ?? firstOffre.prix_unitaire ?? firstOffre.prix_unit ?? firstOffre.montant;
          }
          
          const displayPrice = bestOffre ?? p.prix_unit ?? 0;

          return {
            id: p.id?.toString() || crypto.randomUUID(),
            name: p.produit || p.nom || 'Produit inconnu',
            price: displayPrice.toString(),
            unit: "l'unité", // fallback
            city: p.fournisseur || 'Non spécifié',
            category: ""
          };
        });

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Voici la liste complète des prix de la base de données Supabase (${mappedProducts.length} résultats) :`,
          products: mappedProducts as any
        }]);
      } else {
        // Extraction de mots clés pour la recherche
        const words = text.toLowerCase().split(' ').filter(w => w.length > 2 && !['prix', 'des', 'les', 'pour', 'ton', 'une', 'qui'].includes(w));
        
        // Jointure avec la table offres_prix
        let query = supabase.from('produits').select('*, offres_prix(*)');
        
        if (words.length > 0) {
          const conditions = words.flatMap(w => [`produit.ilike.%${w}%`, `nom.ilike.%${w}%`]).join(',');
          query = query.or(conditions);
        } else {
          query = query.or(`produit.ilike.%${text}%,nom.ilike.%${text}%`);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedProducts = data.map((p: any) => {
            const offres = p.offres_prix || [];
            
            let bestOffre = null;
            if (offres.length > 0) {
              const firstOffre = offres[0];
              bestOffre = firstOffre.prix ?? firstOffre.prix_unitaire ?? firstOffre.prix_unit ?? firstOffre.montant;
            }
            
            const displayPrice = bestOffre ?? p.prix_unit ?? 0;

            return {
              id: p.id?.toString() || crypto.randomUUID(),
              name: p.produit || p.nom || 'Produit inconnu',
              price: displayPrice.toString(),
              unit: "l'unité", // fallback
              city: p.fournisseur || 'Non spécifié',
              category: ""
            };
          });

          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: `Voici ce que j'ai trouvé dans la base Supabase pour "${text}" :`,
            products: mappedProducts as any
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: `Je n'ai rien trouvé pour "${text}" dans la base de données Supabase.`
          }]);
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Une erreur est survenue lors de la recherche dans Supabase: ${error.message || 'Erreur inconnue'}.`
      }]);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const resetUploadModal = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    resetUploadModal();
  };

  const openUploadModal = () => {
    setIsUploadOpen(true);
    setUploadStatus('idle');
    setUploadError(null);
  };


  const handleUploadDevis = async () => {
    if (!access || !access.is_active || access.role === 'readonly') {
      setUploadStatus('error');
      setUploadError('Vous n’avez pas les droits pour téléverser un devis.');
      return;
    }

    if (!selectedFile) {
      setUploadStatus('error');
      setUploadError('Veuillez sélectionner un fichier PDF.');
      return;
    }
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error');
      setUploadError('Le fichier doit être un PDF.');
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('data', selectedFile);

      // L'URL du webhook de votre pipeline d'extraction IA
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (!webhookUrl) {
         throw new Error("L'URL de production Webhook n8n est manquante dans le fichier .env (VITE_N8N_WEBHOOK_URL)");
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Le flux n8n a retourné une erreur : ${response.statusText}`);
      }

      setUploadStatus('success');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Le devis PDF a bien été envoyé à n8n pour analyse par l'IA !\nFichier: ${selectedFile.name}`,
        },
      ]);

      setTimeout(() => closeUploadModal(), 1800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue lors de l\'envoi vers n8n.';
      setUploadStatus('error');
      setUploadError(msg);
    }
  };

  const isAuthenticated = Boolean(sessionUserId);
  const hasAccess = Boolean(access?.is_active);
  const isReadonly = access?.role === 'readonly';

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Chargement de la session…</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Connexion à Prix Devis Evariste</h1>
          <p className="auth-subtitle">Connectez-vous ou créez un compte email pour accéder à l’outil.</p>

          <div className="auth-mode-toggle" role="tablist" aria-label="Mode d'authentification">
            <button
              className={`auth-mode-button ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setAuthError(null);
                setAuthInfo(null);
              }}
              disabled={authActionLoading !== 'none'}
            >
              Connexion
            </button>
            <button
              className={`auth-mode-button ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setAuthError(null);
                setAuthInfo(null);
              }}
              disabled={authActionLoading !== 'none'}
            >
              Inscription
            </button>
          </div>

          <div className="field">
            <div className="label">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
              disabled={authActionLoading !== 'none'}
            />
          </div>
          <div className="field">
            <div className="label">Mot de passe</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={authActionLoading !== 'none'}
              onKeyDown={(e) => e.key === 'Enter' && void handleEmailSignIn()}
            />
          </div>

          {authError && <div className="error-banner">{authError}</div>}
          {authInfo && <div className="success-banner">{authInfo}</div>}

          <div className="auth-actions">
            {authMode === 'signin' ? (
              <button className="primary-button" onClick={() => void handleEmailSignIn()} disabled={authActionLoading !== 'none'}>
                {authActionLoading === 'email' ? 'Connexion…' : 'Se connecter (email)'}
              </button>
            ) : (
              <button className="primary-button" onClick={() => void handleEmailSignUp()} disabled={authActionLoading !== 'none'}>
                {authActionLoading === 'signup' ? 'Création…' : 'Créer un compte (email)'}
              </button>
            )}
            <button className="secondary-button" onClick={() => void handleGoogleSignIn()} disabled={authActionLoading !== 'none'}>
              {authActionLoading === 'google' ? 'Redirection…' : 'Se connecter avec Google'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
            <h1>Accès non autorisé à Prix Devis Evariste</h1>
          <p className="auth-subtitle">
            Votre compte est connecté mais n’est pas actif dans la table `access`. Contactez un administrateur.
          </p>
          {authError && <div className="error-banner">{authError}</div>}
          <button className="secondary-button" onClick={() => void handleSignOut()} disabled={authActionLoading === 'logout'}>
            {authActionLoading === 'logout' ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-title-container">
          <div className="logo-icon">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="header-title">Assistant Prix Devis Evariste</h1>
            <p className="header-subtitle">
              Connecté à Supabase - Base Prix Devis Evariste - {access?.email} ({access?.role})
            </p>
          </div>
        </div>
        <button className="secondary-button" onClick={() => void handleSignOut()} disabled={authActionLoading === 'logout'}>
          {authActionLoading === 'logout' ? 'Déconnexion…' : 'Déconnexion'}
        </button>
      </header>

      {/* CHAT MESSAGES */}
      <main className="chat-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.text}
              
              {/* Hybrid Card Format for Products */}
              {msg.product && (
                <div className="product-card">
                  <div className="product-card-header">
                    <div>
                      <h3 className="product-name">{msg.product.name}</h3>
                      <div className="product-location">
                        <MapPin size={12} color="var(--primary-orange)" />
                        <span>{msg.product.city}</span>
                      </div>
                    </div>
                    <Package size={20} color="var(--text-muted)" />
                  </div>
                  <div className="product-price-section">
                    <div className="price-big">{msg.product.price} €</div>
                    <div className="price-unit">/ {msg.product.unit}</div>
                  </div>
                </div>
              )}
              
              {/* List Format for Multiple Products */}
              {msg.products && (
                <div className="products-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {msg.products.map((p) => (
                    <div key={p.id} className="product-card">
                      <div className="product-card-header">
                        <div>
                          <h3 className="product-name">{p.name}</h3>
                          <div className="product-location">
                            <MapPin size={12} color="var(--primary-orange)" />
                            <span>{p.city}</span>
                          </div>
                        </div>
                        <Package size={20} color="var(--text-muted)" />
                      </div>
                      <div className="product-price-section">
                        <div className="price-big">{p.price} €</div>
                        <div className="price-unit">/ {p.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Invisible div for auto-scroll */}
        <div ref={chatEndRef} />
      </main>

      {/* QUICK ACTIONS SCROLLBAR */}
      <div className="quick-actions">
        <button className="action-pill" onClick={openUploadModal} disabled={isReadonly}>
          <Upload size={14} /> Téléverser un devis
        </button>
        <button className="action-pill" onClick={() => handleQuickAction("Tous les prix")}>
          <Search size={14} /> Liste des prix
        </button>
        <button className="action-pill" onClick={() => handleQuickAction("Prix du sable 0/4")}>
          <Search size={14} /> Sable 0/4
        </button>
        <button className="action-pill" onClick={() => handleQuickAction("Béton C25/30")}>
          <Search size={14} /> Toupie Béton
        </button>
        <button className="action-pill" onClick={() => handleQuickAction("Enrobé à chaud")}>
          Enrobé <ChevronRight size={14} />
        </button>
      </div>

      {/* INPUT BAR */}
      <footer className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            className="text-input"
                    placeholder="Écrivez votre recherche... (ex: prix du sable au m3)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isReadonly && handleSend(inputValue)}
            disabled={isReadonly}
          />
          <button
            className="send-button"
            disabled={!inputValue.trim() || isReadonly}
            onClick={() => handleSend(inputValue)}
            aria-label="Envoyer"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Téléverser un devis">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Téléverser un devis (PDF)</div>
                <div className="modal-subtitle">Le fichier est stocké dans Supabase Storage + une ligne est créée dans `produits`.</div>
              </div>
              <button className="icon-button" onClick={closeUploadModal} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="field">
                <div className="label">Fichier PDF</div>
                <div className="row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    disabled={uploadStatus === 'uploading'}
                  />
                  {selectedFile && (
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={uploadStatus === 'uploading'}
                    >
                      <X size={14} /> Retirer
                    </button>
                  )}
                </div>
                {selectedFile && <div className="hint">Sélectionné : {selectedFile.name}</div>}
              </div>

              {uploadError && <div className="error-banner">{uploadError}</div>}
              {uploadStatus === 'success' && <div className="success-banner">Téléversement réussi et envoyé à n8n.</div>}
              <div className="modal-actions">
                <button className="secondary-button" onClick={closeUploadModal} disabled={uploadStatus === 'uploading'}>
                  Annuler
                </button>
                <button className="primary-button" onClick={handleUploadDevis} disabled={uploadStatus === 'uploading'}>
                  {uploadStatus === 'uploading' ? 'Envoi...' : 'Envoyer vers n8n (IA)'}
                </button>
              </div>
              <div className="hint">
                Note: Le document PDF est envoyé de façon sécurisée à l'agent IA pour une extraction automatique et insertion en base.
              </div>
              {isReadonly && (
                <div className="error-banner">Votre rôle est `readonly` : le téléversement est désactivé.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
