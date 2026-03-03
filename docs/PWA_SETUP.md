# Configuração de Ícones PWA para MedPrep

## ✅ O que foi corrigido

1. **manifest.webmanifest** - Criado com todas as configurações necessárias
2. **Meta tags PWA** - Adicionada `mobile-web-app-capable` para Android
3. **Referências de ícones** - Temporariamente usando favicon.svg

## 🎨 Como Gerar Ícones Profissionais

### Opção 1: Usar Ferramenta Online (Recomendado)

1. Acesse: **https://www.favicon-generator.org/**
2. Faça upload do seu logo/ícone (arquivo SVG ou PNG)
3. Customize as cores (use #0f172a como background, #14b8a6 como acento)
4. Baixe o pacote de ícones gerado
5. Extraia e coloque os arquivos em `/public/`:
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `apple-touch-icon.png` (opcional, sobrescreve o favicon.svg)

### Opção 2: Usar ImageMagick (Linha de Comando)

```bash
# Converter favicon.svg para PNGs
convert -background "#0f172a" -geometry 192x192 public/favicon.svg public/icon-192x192.png
convert -background "#0f172a" -geometry 512x512 public/favicon.svg public/icon-512x512.png
convert -background "#0f172a" -geometry 180x180 public/favicon.svg public/apple-touch-icon.png
```

### Opção 3: Usar ffmpeg com ImageMagick

```bash
# Se tiver GraphicsMagick/ImageMagick instalado
magick public/favicon.svg -background "#0f172a" -size 192x192 public/icon-192x192.png
```

## 📁 Estrutura Final Esperada

```
public/
├── favicon.svg (já existe)
├── manifest.webmanifest (✅ criado)
├── icon-192x192.png (📝 TODO)
├── icon-512x512.png (📝 TODO)
└── apple-touch-icon.png (📝 TODO)
```

## 🧪 Teste a PWA

### Android (Chrome)
1. Abra `localhost:5174` no Chrome
2. Menu → "Instalar MedPrep"
3. O ícone de 192x192 será usado

### iPhone (Safari)
1. Abra `localhost:5174` no Safari
2. Compartilhar → "Adicionar à Tela de Início"
3. Usa `apple-touch-icon.png` ou `favicon.svg` como fallback

### Windows/Mac/Linux
1. Menu de 3 pontos → "Instalar MedPrep"
2. O ícone de 512x512 será usado

## 🔧 Atualizar Manifest

Se precisar adicionar mais configurações, edite `/public/manifest.webmanifest` com:

```json
{
  "categories": ["education", "medical", "productivity"],
  "shortcuts": [
    {
      "name": "Questões",
      "short_name": "Questões",
      "description": "Começar bloco de questões",
      "url": "/questoes",
      "icons": [{ "src": "icon-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

## 📱 Cores Recomendadas para Ícone

- **Background**: `#0f172a` (azul escuro)
- **Acento**: `#14b8a6` (teal)
- **Texto**: `#ffffff` (branco)

---

**Próximo Passo**: Faça download dos ícones PNG e coloque em `/public/` 📦
