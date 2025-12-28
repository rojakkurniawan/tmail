package api

import (
	"context"
	"os"
	"path/filepath"
	"tmail/internal/pubsub"
	"tmail/internal/utils"

	"github.com/jhillyerd/enmime/v2"
	"github.com/rs/zerolog/log"
)

// Report godoc
// @Summary Report incoming email
// @Description Internal endpoint - Used by Cloudflare Workers to report incoming emails. This endpoint receives raw email data in MIME format and stores it in the database.
// @Tags Internal
// @Accept */*
// @Param to query string true "Recipient email address"
// @Success 200 "Email successfully stored"
// @Failure 400 "Failed to process email"
// @Router /report [post]
func Report(ctx *Context) error {
	to := ctx.QueryParam("to")
	if to == "" {
		return nil
	}
	envelope, err := enmime.ReadEnvelope(ctx.Request().Body)
	if err != nil {
		return err
	}
	subject := envelope.GetHeader("subject")
	from := envelope.GetHeader("from")
	content := envelope.HTML
	if content == "" {
		content = envelope.Text
	}

	log.Debug().Msgf("Report: %s <- %s: %s", to, from, subject)
	e, err := ctx.ent.Envelope.Create().
		SetTo(to).
		SetFrom(from).
		SetSubject(subject).
		SetContent(content).
		Save(ctx.Request().Context())
	if err == nil {
		go pubsub.Publish(e)
		go saveAttachment(ctx, envelope.Attachments, to, e.ID)
	}
	return err
}

func saveAttachment(ctx *Context, attachments []*enmime.Part, to string, ownerID int) {
	const maxSize = 200000000 // 200M
	if len(attachments) == 0 {
		return
	}

	var dir = filepath.Join(ctx.BaseDir, utils.Md5(to)[:16])
	if err := os.MkdirAll(dir, 0o755); err != nil {
		log.Err(err).Msg("MkdirAll")
		return
	}

	for _, a := range attachments {
		if a.FileName == "" || len(a.Content) > maxSize {
			continue
		}

		name := utils.Md5(a.FileName)
		fp := filepath.Join(dir, name)
		log.Info().Msgf("Attachment: %s -> %s", a.FileName, fp)
		if err := os.WriteFile(fp, a.Content, 0o644); err != nil {
			log.Err(err).Msg("WriteFile")
			continue
		}

		_, err := ctx.ent.Attachment.Create().
			SetID(filepath.Base(dir) + name[:6] + utils.RandomStr(4)).
			SetFilename(a.FileName).
			SetFilepath(fp).
			SetContentType(a.ContentType).
			SetOwnerID(ownerID).
			Save(context.TODO())
		if err != nil {
			_ = os.Remove(fp)
			log.Err(err).Msg("Attachment Save")
		}
	}
}
