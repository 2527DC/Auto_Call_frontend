'use strict';
'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Search,
  BookOpen,
  Settings,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

import { PageHeader } from '@/components/reusable/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationModal } from '@/components/reusable/DeleteConfirmationModal';
import { Loader2 } from '@/components/reusable/Loader2';

import {
  useGetAdminKnowledgeQuery,
  useCreateAdminKnowledgeMutation,
  useUpdateAdminKnowledgeMutation,
  useDeleteAdminKnowledgeMutation,
  useGetAdminAssistantConfigQuery,
  useUpdateAdminAssistantConfigMutation,
} from '@/redux/api/systemAssistantApi';
import { SystemAssistantKnowledge, SystemAssistantAdminConfig } from '@/types/system-assistant';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'workflow_nodes', label: 'Workflow Nodes' },
  { value: 'flows', label: 'Flow Logic & Routing' },
  { value: 'contacts', label: 'Contacts & Groups' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'voice_agents', label: 'AI Voice Agents' },
  { value: 'phone_numbers', label: 'Phone Numbers & SIP' },
  { value: 'settings', label: 'System Settings' },
  { value: 'general', label: 'General Guides' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
];

export default function SystemAssistantKnowledgePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'articles' | 'config'>('articles');

  // Articles list filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modal states
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<SystemAssistantKnowledge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states for article creation/editing
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('workflow_nodes');
  const [routeMatch, setRouteMatch] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // API Queries & Mutations
  const { data: knowledgeData, isLoading: isLoadingKnowledge, refetch: refetchKnowledge } = useGetAdminKnowledgeQuery({
    page,
    limit: 20,
    search,
    category: categoryFilter,
  });

  const { data: configData, isLoading: isLoadingConfig } = useGetAdminAssistantConfigQuery();

  const [createKnowledge, { isLoading: isCreating }] = useCreateAdminKnowledgeMutation();
  const [updateKnowledge, { isLoading: isUpdating }] = useUpdateAdminKnowledgeMutation();
  const [deleteKnowledge, { isLoading: isDeleting }] = useDeleteAdminKnowledgeMutation();
  const [updateConfig, { isLoading: isUpdatingConfig }] = useUpdateAdminAssistantConfigMutation();

  // Config form state
  const [configForm, setConfigForm] = useState<Partial<SystemAssistantAdminConfig>>({});

  React.useEffect(() => {
    if (configData?.data) {
      setConfigForm({
        is_enabled: configData.data.is_enabled,
        bot_name: configData.data.bot_name,
        welcome_message: configData.data.welcome_message,
        ai_provider: configData.data.ai_provider,
        ai_model: configData.data.ai_model,
        custom_api_key: configData.data.custom_api_key,
        temperature: configData.data.temperature,
        system_prompt: configData.data.system_prompt,
        suggested_prompts: configData.data.suggested_prompts,
      });
    }
  }, [configData]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setCategory('workflow_nodes');
    setRouteMatch('/workflow-builder');
    setContent('');
    setTags('');
    setOrder(0);
    setIsActive(true);
    setIsArticleModalOpen(true);
  };

  const openEditModal = (article: SystemAssistantKnowledge) => {
    setEditingArticle(article);
    setTitle(article.title);
    setCategory(article.category);
    setRouteMatch((article.route_match || []).join(', '));
    setContent(article.content);
    setTags((article.tags || []).join(', '));
    setOrder(article.order || 0);
    setIsActive(article.is_active);
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required.');
      return;
    }

    const payload = {
      title: title.trim(),
      category: category as any,
      route_match: routeMatch.split(',').map((r) => r.trim()).filter(Boolean),
      content: content.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      order: Number(order) || 0,
      is_active: isActive,
    };

    try {
      if (editingArticle) {
        await updateKnowledge({ id: editingArticle._id || editingArticle.id, data: payload }).unwrap();
        toast.success('Knowledge article updated successfully.');
      } else {
        await createKnowledge(payload).unwrap();
        toast.success('Knowledge article created successfully.');
      }
      setIsArticleModalOpen(false);
      refetchKnowledge();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save knowledge article.');
    }
  };

  const handleDeleteArticle = async () => {
    if (!deleteId) return;
    try {
      await deleteKnowledge(deleteId).unwrap();
      toast.success('Knowledge article deleted.');
      setDeleteId(null);
      refetchKnowledge();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete knowledge article.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig(configForm).unwrap();
      toast.success('Assistant settings saved successfully.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save assistant settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="In-App AI Assistant & Knowledge Base"
        showBackButton={false}
        endContent={
          <div className="flex items-center gap-3">
            <Button
              variant={activeTab === 'articles' ? 'default' : 'outline'}
              onClick={() => setActiveTab('articles')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Knowledge Articles
            </Button>
            <Button
              variant={activeTab === 'config' ? 'default' : 'outline'}
              onClick={() => setActiveTab('config')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Assistant Settings
            </Button>
          </div>
        }
      />

      {/* TAB 1: KNOWLEDGE ARTICLES */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border">
            <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles, keywords, tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={openCreateModal} className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add Knowledge Article
            </Button>
          </div>

          {isLoadingKnowledge ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : knowledgeData?.data?.articles?.length === 0 ? (
            <Card className="text-center py-16 border-dashed">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Knowledge Articles Fed Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    The floating AI bot starts with an empty knowledge base. Add articles explaining how to build flows, how nodes work, or how to import contacts.
                  </p>
                </div>
                <Button onClick={openCreateModal} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Feed First Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeData?.data?.articles?.map((article) => (
                <Card key={article._id || article.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {article.category.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {article.is_active ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                            <XCircle className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold line-clamp-1 mt-2">
                      {article.title}
                    </CardTitle>
                    {article.route_match && article.route_match.length > 0 && (
                      <CardDescription className="text-xs flex items-center gap-1 text-primary">
                        <Layers className="w-3 h-3 shrink-0" />
                        <span className="truncate">{article.route_match.join(', ')}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line font-mono bg-muted/40 p-2.5 rounded-md">
                      {article.content}
                    </p>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(article)}
                        className="h-8 px-2 text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(article._id || article.id)}
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSISTANT CONFIGURATION */}
      {activeTab === 'config' && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Floating Bot Settings</CardTitle>
                <CardDescription>
                  Configure the AI model, system prompt, and default quick prompts for members.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingConfig ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                  <div>
                    <Label className="text-base font-semibold">Enable Floating Assistant</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, members see the floating bot on the bottom-right corner of their dashboard.
                    </p>
                  </div>
                  <Switch
                    checked={configForm.is_enabled ?? true}
                    onCheckedChange={(checked) => setConfigForm((prev) => ({ ...prev, is_enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot_name">Bot Display Name</Label>
                    <Input
                      id="bot_name"
                      value={configForm.bot_name || ''}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, bot_name: e.target.value }))}
                      placeholder="Voxeno Assistant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai_provider">AI Provider</Label>
                    <Select
                      value={configForm.ai_provider || 'gemini'}
                      onValueChange={(val: any) => {
                        const defaultModel =
                          val === 'gemini'
                            ? 'gemini-2.5-flash'
                            : val === 'openai'
                            ? 'gpt-4o-mini'
                            : 'claude-3-haiku-20240307';
                        setConfigForm((prev) => ({ ...prev, ai_provider: val, ai_model: defaultModel }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini (Fast & Large Context)</SelectItem>
                        <SelectItem value="openai">OpenAI (GPT-4o mini)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai_model">Model ID</Label>
                    <Input
                      id="ai_model"
                      value={configForm.ai_model || ''}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, ai_model: e.target.value }))}
                      placeholder="gemini-2.5-flash / gpt-4o-mini"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature ({configForm.temperature ?? 0.2})</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={configForm.temperature ?? 0.2}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_api_key">
                    Custom API Key (Optional Override)
                  </Label>
                  <Input
                    id="custom_api_key"
                    type="password"
                    value={configForm.custom_api_key || ''}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, custom_api_key: e.target.value }))}
                    placeholder="Leave empty to use server .env / platform keys"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If left blank, the bot automatically uses server keys (e.g. GEMINI_API_KEY from .env).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome_message">Welcome Message</Label>
                  <Textarea
                    id="welcome_message"
                    rows={2}
                    value={configForm.welcome_message || ''}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, welcome_message: e.target.value }))}
                    placeholder="What the bot says when user first opens the chat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggested_prompts">
                    Suggested Quick Prompts (One prompt per line)
                  </Label>
                  <Textarea
                    id="suggested_prompts"
                    rows={4}
                    value={(configForm.suggested_prompts || []).join('\n')}
                    onChange={(e) =>
                      setConfigForm((prev) => ({
                        ...prev,
                        suggested_prompts: e.target.value.split('\n').filter((p) => p.trim()),
                      }))
                    }
                    placeholder="How do I create a workflow?&#10;How does the Decision Split node work?&#10;How to add contacts?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system_prompt">System Persona & Guardrails</Label>
                  <Textarea
                    id="system_prompt"
                    rows={5}
                    value={configForm.system_prompt || ''}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, system_prompt: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isUpdatingConfig} className="flex items-center gap-2">
                    {isUpdatingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT ARTICLE MODAL */}
      <Dialog open={isArticleModalOpen} onOpenChange={setIsArticleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Edit Knowledge Article' : 'Add Knowledge Article'}
            </DialogTitle>
            <DialogDescription>
              Feed system guidance or node documentation into the bot. Markdown formatting is fully supported.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveArticle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Workflow Node: Decision Split"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeMatch">Related URL Route (Optional)</Label>
                <Input
                  id="routeMatch"
                  value={routeMatch}
                  onChange={(e) => setRouteMatch(e.target.value)}
                  placeholder="e.g. /workflow-builder, /contact-hub"
                />
                <p className="text-[11px] text-muted-foreground">
                  Prioritizes this article when member is currently viewing this page.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Article Content (Markdown) *</Label>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Supports **bold**, bullet points, code blocks
                </span>
              </div>
              <Textarea
                id="content"
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain how this feature or node works, parameters, step-by-step usage, and common mistakes to avoid..."
                className="font-mono text-xs leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. node, logic, decision, flow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Priority Order (0 = Default)</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
              <div>
                <Label className="text-sm font-semibold">Active Status</Label>
                <p className="text-[11px] text-muted-foreground">
                  When active, this article is included in the assistant context.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsArticleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Article
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteArticle}
        title="Delete Knowledge Article"
        description="Are you sure you want to delete this knowledge article? The floating assistant will no longer have access to this information."
        isLoading={isDeleting}
      />
    </div>
  );
}
