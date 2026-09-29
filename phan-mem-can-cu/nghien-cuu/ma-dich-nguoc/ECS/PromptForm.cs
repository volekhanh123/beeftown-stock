using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class PromptForm : Form
{
	private IContainer components;

	private Label promptLabel;

	private CheckBox dontAskCheckBox;

	private Button yesButton;

	private Button noButton;

	private PictureBox iconBox;

	public bool DontAsk => dontAskCheckBox.Checked;

	public PromptForm()
	{
		InitializeComponent();
	}

	private void PromptForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_PromptSave");
		dontAskCheckBox.Text = Program.GetLang("pw_Don'taskmeagain");
		noButton.Text = Program.GetLang("pw_No");
		promptLabel.Text = Program.GetLang("pw_Doyouwanttosavemodifieddata?");
		yesButton.Text = Program.GetLang("pw_Yes");
		Font = Settings.Default.CustomFont;
		iconBox.Image = SystemIcons.Question.ToBitmap();
	}

	private void dontAskCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		noButton.Enabled = !dontAskCheckBox.Checked;
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.PromptForm));
		this.promptLabel = new System.Windows.Forms.Label();
		this.dontAskCheckBox = new System.Windows.Forms.CheckBox();
		this.yesButton = new System.Windows.Forms.Button();
		this.noButton = new System.Windows.Forms.Button();
		this.iconBox = new System.Windows.Forms.PictureBox();
		((System.ComponentModel.ISupportInitialize)this.iconBox).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.promptLabel, "promptLabel");
		this.promptLabel.Name = "promptLabel";
		resources.ApplyResources(this.dontAskCheckBox, "dontAskCheckBox");
		this.dontAskCheckBox.Name = "dontAskCheckBox";
		this.dontAskCheckBox.UseVisualStyleBackColor = true;
		this.dontAskCheckBox.CheckedChanged += new System.EventHandler(dontAskCheckBox_CheckedChanged);
		this.yesButton.DialogResult = System.Windows.Forms.DialogResult.Yes;
		resources.ApplyResources(this.yesButton, "yesButton");
		this.yesButton.Name = "yesButton";
		this.yesButton.UseVisualStyleBackColor = true;
		this.noButton.DialogResult = System.Windows.Forms.DialogResult.No;
		resources.ApplyResources(this.noButton, "noButton");
		this.noButton.Name = "noButton";
		this.noButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.iconBox, "iconBox");
		this.iconBox.Name = "iconBox";
		this.iconBox.TabStop = false;
		base.AcceptButton = this.yesButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ControlBox = false;
		base.Controls.Add(this.iconBox);
		base.Controls.Add(this.noButton);
		base.Controls.Add(this.yesButton);
		base.Controls.Add(this.dontAskCheckBox);
		base.Controls.Add(this.promptLabel);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.Name = "PromptForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(PromptForm_Load);
		((System.ComponentModel.ISupportInitialize)this.iconBox).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
