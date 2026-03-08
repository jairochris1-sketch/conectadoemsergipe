import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const About = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre Nós"
        description="Conheça o Conectados em Sergipe, a rede social que conecta pessoas, comunidades e negócios em todo o estado de Sergipe."
        path="/sobre"
        jsonLd={{
          "@type": "AboutPage",
          "name": "Sobre o Conectados em Sergipe",
          "description": "Rede social que conecta pessoas, comunidades e negócios em Sergipe.",
          "url": "https://conectadoemsergipe.lovable.app/sobre",
          "isPartOf": {
            "@type": "WebSite",
            "name": "Conectados em Sergipe",
            "url": "https://conectadoemsergipe.lovable.app",
          },
          "mainEntity": {
            "@type": "Organization",
            "name": "Conectados em Sergipe",
            "url": "https://conectadoemsergipe.lovable.app",
            "description": "Rede social sergipana que aproxima pessoas, fortalece comunidades e impulsiona o comércio local.",
            "foundingLocation": {
              "@type": "Place",
              "name": "Sergipe, Brasil",
            },
          },
        }}
      />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-[760px] mx-auto px-2 py-4">
        <div className="bg-card border border-border p-4 space-y-5">
          {/* Header */}
          <div className="border-b border-border pb-3">
            <h1 className="text-[20px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
              Sobre o Conectados em Sergipe
            </h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              A rede social feita por sergipanos, para sergipanos.
            </p>
          </div>

          {/* Mission */}
          <section>
            <h2 className="text-[14px] font-bold text-primary mb-2" style={{ fontFamily: "Georgia, serif" }}>
              🎯 Nossa Missão
            </h2>
            <p className="text-[12px] text-foreground leading-relaxed">
              O <strong>Conectados em Sergipe</strong> nasceu com o objetivo de criar um espaço digital genuinamente sergipano, 
              onde pessoas de todas as cidades do estado possam se conectar, compartilhar experiências e fortalecer laços 
              comunitários. Acreditamos que a tecnologia deve aproximar pessoas e valorizar a identidade local.
            </p>
          </section>

          {/* What we offer */}
          <section>
            <h2 className="text-[14px] font-bold text-primary mb-2" style={{ fontFamily: "Georgia, serif" }}>
              🌟 O Que Oferecemos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "👥", title: "Rede Social", desc: "Conecte-se com amigos, familiares e pessoas de todo Sergipe. Compartilhe momentos, fotos e pensamentos." },
                { icon: "🛒", title: "Marketplace Local", desc: "Compre e venda produtos de forma prática. De móveis a eletrônicos, tudo ao alcance da sua comunidade." },
                { icon: "💬", title: "Mensagens Privadas", desc: "Converse em tempo real com seus contatos de forma segura e privada." },
                { icon: "🔍", title: "Busca Inteligente", desc: "Encontre pessoas, lojas e serviços em todo o estado de Sergipe." },
              ].map((item) => (
                <div key={item.title} className="bg-accent/50 border border-border p-3 rounded">
                  <p className="text-[13px] font-bold mb-1">{item.icon} {item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why Sergipe */}
          <section>
            <h2 className="text-[14px] font-bold text-primary mb-2" style={{ fontFamily: "Georgia, serif" }}>
              💚 Por Que Sergipe?
            </h2>
            <p className="text-[12px] text-foreground leading-relaxed">
              Sergipe é o menor estado do Brasil, mas com uma riqueza cultural e humana imensa. Das praias de Aracaju 
              ao sertão de Canindé de São Francisco, cada cidade tem sua história e sua gente. O Conectados em Sergipe 
              quer ser a ponte digital que une todas essas comunidades, dando voz e visibilidade a quem vive e ama este estado.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-[14px] font-bold text-primary mb-2" style={{ fontFamily: "Georgia, serif" }}>
              📌 Nossos Valores
            </h2>
            <ul className="text-[12px] text-foreground space-y-2 list-none pl-0">
              {[
                { emoji: "🤝", text: "Comunidade — Priorizamos conexões reais e significativas." },
                { emoji: "🔒", text: "Segurança — Seus dados e privacidade são protegidos com moderação ativa." },
                { emoji: "🌎", text: "Inclusão — Um espaço para todos os sergipanos, sem exceção." },
                { emoji: "💡", text: "Inovação — Evoluímos constantemente para oferecer a melhor experiência." },
              ].map((v) => (
                <li key={v.text} className="flex items-start gap-2">
                  <span>{v.emoji}</span>
                  <span>{v.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="bg-primary/5 border border-primary/20 p-4 text-center rounded">
            <p className="text-[13px] font-bold text-primary mb-2">Faça parte dessa comunidade!</p>
            <p className="text-[11px] text-muted-foreground mb-3">
              Junte-se a milhares de sergipanos que já estão conectados.
            </p>
            <div className="flex justify-center gap-2">
              <a
                href="/register"
                className="bg-primary text-primary-foreground px-4 py-[6px] text-[11px] font-bold no-underline hover:opacity-90"
              >
                Criar Conta
              </a>
              <a
                href="/login"
                className="bg-muted text-foreground border border-border px-4 py-[6px] text-[11px] font-bold no-underline hover:bg-accent"
              >
                Entrar
              </a>
            </div>
          </section>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default About;
