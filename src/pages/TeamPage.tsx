import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mail } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import { Badge } from '../components/ui/badge';
import ScrollToTop from '../components/ScrollToTop';

const teamMembers = [
  {
    name: 'Prasad Sankar',
    role: 'Co-Founder',
    avatar: '../../public/prasad.jpeg',
    fallback: 'PS',
    bio: 'SWE-ML @ Stealth, 6x Hackathon Winner',
    skills: [
      'Software Engineering',
      'Blockchain',
      'Artificial Intelligence'
    ]
  },
  {
    name: 'Vaibhav Pandey',
    role: 'Co-Founder',
    avatar: '../../public/vaibhav.png',
    fallback: 'VP',
    bio: 'SWE @ CoinDCX, Ex-Push Chain & Instadapp, 9x Hackathon Winner',
    skills: [
        'Software Engineering',
        'Backend Systems',
        'Blockchain'
    ]
  },
  {
    name: 'Arun Thomas',
    role: 'Co-Founder',
    avatar: '../../public/arun.png',
    fallback: 'AT',
    bio: 'Figuring out the web3 world..',
    skills: [
      'Product Strategy',
      'Growth',
      'Go-To-Market'
    ]
  },
];

const TeamMemberCard = ({ member }: { member: (typeof teamMembers)[0] }) => (
  <Card className="flex flex-col">
    <CardHeader className="flex flex-col items-center text-center p-6">
      <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20">
        <AvatarImage src={member.avatar} alt={member.name} />
        <AvatarFallback className="text-3xl">{member.fallback}</AvatarFallback>
      </Avatar>
      <CardTitle className="text-2xl">{member.name}</CardTitle>
      <p className="text-primary font-semibold mt-1">{member.role}</p>
    </CardHeader>
    <CardContent className="flex-grow flex flex-col p-6 pt-0">
      <p className="text-muted-foreground text-center mb-6 flex-grow">{member.bio}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {member.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
      </div>
    </CardContent>
  </Card>
);

export default function TeamPage() {
  return (
    <div className="bg-background text-foreground">
      <ScrollToTop />
      <main className="container mx-auto max-w-6xl py-16 px-4">
        <section className="text-center mb-20">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Meet the Team</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            The passionate individuals dedicated to revolutionizing document security and signing.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {teamMembers.map(member => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </section>

        <section className="text-center border-t pt-16">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Have questions, feedback, or want to explore partnership opportunities? We'd love to hear from you.
            </p>
            <Button asChild size="lg">
                <a href="mailto:ar.perma.sign@gmail.com">
                    <Mail className="mr-2 h-5 w-5" />
                    Contact Us
                </a>
            </Button>
        </section>
      </main>
      <AppFooter />
    </div>
  );
} 