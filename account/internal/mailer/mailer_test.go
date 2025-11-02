package mailer

import "testing"

func TestParseTLSMode(t *testing.T) {
	cases := map[string]TLSMode{
		"":          TLSModeAuto,
		"auto":      TLSModeAuto,
		"automatic": TLSModeAuto,
		"detect":    TLSModeAuto,
		"starttls":  TLSModeStartTLS,
		"start_tls": TLSModeStartTLS,
		"start-tls": TLSModeStartTLS,
		"implicit":  TLSModeImplicit,
		"smtps":     TLSModeImplicit,
		"none":      TLSModeNone,
		"disable":   TLSModeNone,
		"disabled":  TLSModeNone,
		"off":       TLSModeNone,
		"plain":     TLSModeNone,
		"plaintext": TLSModeNone,
		"unknown":   TLSModeAuto,
	}

	for input, expected := range cases {
		if mode := ParseTLSMode(input); mode != expected {
			t.Errorf("ParseTLSMode(%q) = %q, expected %q", input, mode, expected)
		}
	}
}

func TestNewImplicitModeAutodetect(t *testing.T) {
	sender, err := New(Config{
		Host: "smtp.example.com",
		Port: 465,
		From: "Example <no-reply@example.com>",
	})
	if err != nil {
		t.Fatalf("unexpected error creating sender: %v", err)
	}

	s, ok := sender.(*smtpSender)
	if !ok {
		t.Fatalf("expected smtpSender, got %T", sender)
	}
	if s.tlsMode != TLSModeImplicit {
		t.Fatalf("expected tlsMode %q, got %q", TLSModeImplicit, s.tlsMode)
	}
}
