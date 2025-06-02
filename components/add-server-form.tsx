"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const serverSchema = z.object({
  url: z
    .string()
    .min(1, { message: 'A URL é obrigatória' })
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'A URL deve começar com http:// ou https://',
    }),
  username: z.string().min(1, { message: 'O nome de usuário é obrigatório' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
});

type ServerFormValues = z.infer<typeof serverSchema>;

interface AddServerFormProps {
  onServerAdded: () => void;
}

export function AddServerForm({ onServerAdded }: AddServerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: ServerFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar o servidor');
      }

      form.reset();
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
  );
}
