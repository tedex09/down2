"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { parseM3ULink, buildServerUrl } from '@/lib/m3u-parser';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link, Settings } from 'lucide-react';

const serverSchema = z.object({
  url: z
    .string()
    .min(1, { message: 'A URL é obrigatória' })
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'A URL deve começar com http:// ou https://',
    }),
  username: z.string().min(1, { message: 'O nome de usuário é obrigatório' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
  name: z.string().optional(),
});

const m3uSchema = z.object({
  m3uUrl: z
    .string()
    .min(1, { message: 'O link M3U é obrigatório' })
    .url({ message: 'Deve ser um link válido' }),
  name: z.string().optional(),
});

type ServerFormValues = z.infer<typeof serverSchema>;
type M3UFormValues = z.infer<typeof m3uSchema>;

interface AddServerFormProps {
  onServerAdded: () => void;
}

export function AddServerForm({ onServerAdded }: AddServerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const { toast } = useToast();

  const serverForm = useForm<ServerFormValues>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
      name: '',
    },
  });

  const m3uForm = useForm<M3UFormValues>({
    resolver: zodResolver(m3uSchema),
    defaultValues: {
      m3uUrl: '',
      name: '',
    },
  });

  async function onSubmitServer(data: ServerFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          isM3U: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar o servidor');
      }

      serverForm.reset();
      toast({
        title: 'Servidor adicionado',
        description: 'O servidor IPTV foi adicionado com sucesso.',
      });
      onServerAdded();
    } catch (error) {
      console.error('Erro ao adicionar servidor:', error);
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível adicionar o servidor. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmitM3U(data: M3UFormValues) {
    setIsSubmitting(true);
    try {
      const parsedData = parseM3ULink(data.m3uUrl);
      
      if (!parsedData) {
        throw new Error('Não foi possível extrair os dados do link M3U. Verifique se o formato está correto.');
      }

      const serverData = {
        url: buildServerUrl(parsedData.dns),
        username: parsedData.username,
        password: parsedData.password,
        name: data.name || parsedData.name,
        isM3U: true,
      };

      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar a lista M3U');
      }

      m3uForm.reset();
      toast({
        title: 'Lista M3U adicionada',
        description: 'A lista IPTV foi adicionada com sucesso.',
      });
      onServerAdded();
    } catch (error) {
      console.error('Erro ao adicionar lista M3U:', error);
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível adicionar a lista M3U. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Manual
        </TabsTrigger>
        <TabsTrigger value="m3u" className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          Link M3U
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual" className="mt-4">
        <Form {...serverForm}>
          <form onSubmit={serverForm.handleSubmit(onSubmitServer)} className="space-y-4">
            <FormField
              control={serverForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Lista (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Minha Lista IPTV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={serverForm.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Servidor</FormLabel>
                  <FormControl>
                    <Input placeholder="http://exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={serverForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={serverForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando servidor...
                </>
              ) : (
                'Adicionar Servidor'
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="m3u" className="mt-4">
        <Form {...m3uForm}>
          <form onSubmit={m3uForm.handleSubmit(onSubmitM3U)} className="space-y-4">
            <FormField
              control={m3uForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Lista (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Minha Lista M3U" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={m3uForm.control}
              name="m3uUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link M3U</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="https://exemplo.com/get.php?username=USUARIO&password=SENHA&type=m3u_plus&output=ts"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    O sistema extrairá automaticamente o usuário, senha e DNS do link M3U
                  </p>
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando lista M3U...
                </>
              ) : (
                'Adicionar Lista M3U'
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
