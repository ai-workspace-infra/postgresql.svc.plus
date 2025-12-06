package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/spf13/cobra"

	"account/internal/syncer"
)

func main() {
	var cfgPath string
	root := &cobra.Command{
		Use:   "syncctl",
		Short: "Synchronise account service data across regions",
		PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
			if cfgPath == "" {
				return fmt.Errorf("--config is required")
			}
			return nil
		},
	}

	root.PersistentFlags().StringVar(&cfgPath, "config", "", "Path to synchronisation config file")

	root.AddCommand(newPushCmd(&cfgPath))
	root.AddCommand(newPullCmd(&cfgPath))
	root.AddCommand(newMirrorCmd(&cfgPath))

	if err := root.Execute(); err != nil {
		log.Fatal(err)
	}
}

func loadSyncer(configPath string) (*syncer.Syncer, func(), error) {
	cfg, err := syncer.LoadConfig(configPath)
	if err != nil {
		return nil, nil, err
	}
	logger := log.New(os.Stdout, "[syncctl] ", log.LstdFlags)
	s := syncer.New(cfg, logger)
	return s, func() {}, nil
}

func newPushCmd(cfgPath *string) *cobra.Command {
	return &cobra.Command{
		Use:   "push",
		Short: "Export local snapshot and push to the remote environment",
		RunE: func(cmd *cobra.Command, args []string) error {
			sync, cancel, err := loadSyncer(*cfgPath)
			if err != nil {
				return err
			}
			defer cancel()

			ctx, cancelRun := context.WithTimeout(cmd.Context(), 5*time.Minute)
			defer cancelRun()
			return sync.Push(ctx)
		},
	}
}

func newPullCmd(cfgPath *string) *cobra.Command {
	return &cobra.Command{
		Use:   "pull",
		Short: "Fetch remote snapshot and import into the local environment",
		RunE: func(cmd *cobra.Command, args []string) error {
			sync, cancel, err := loadSyncer(*cfgPath)
			if err != nil {
				return err
			}
			defer cancel()

			ctx, cancelRun := context.WithTimeout(cmd.Context(), 5*time.Minute)
			defer cancelRun()
			return sync.Pull(ctx)
		},
	}
}

func newMirrorCmd(cfgPath *string) *cobra.Command {
	return &cobra.Command{
		Use:   "mirror",
		Short: "Perform push then pull to keep both sides aligned",
		RunE: func(cmd *cobra.Command, args []string) error {
			sync, cancel, err := loadSyncer(*cfgPath)
			if err != nil {
				return err
			}
			defer cancel()

			ctx, cancelRun := context.WithTimeout(cmd.Context(), 10*time.Minute)
			defer cancelRun()
			return sync.Mirror(ctx)
		},
	}
}

func init() {
	// Ensure the default flag.CommandLine is not used by Cobra.
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)
}
